"use server";
import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// We no longer need fs or path because we are not saving to a local folder!

export async function uploadBulkResumes(formData) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const adminId = cookieStore.get('userId')?.value;

    const files = formData.getAll('files');
    if (!files || files.length === 0) return { success: false, error: "No files found." };

    // 1. Get existing filenames to prevent duplicates
    const existingFiles = await Resume.find({}, { originalName: 1 }).lean();
    const existingFileNames = new Set(existingFiles.map(f => f.originalName));
    const newFiles = files.filter(file => !existingFileNames.has(file.name));

    if (newFiles.length === 0) {
      return { 
        success: false, 
        duplicateCount: files.length, 
        totalSelected: files.length, 
        message: "All files are duplicates." 
      };
    }

    // 2. Get the starting Resume Number
    const lastResume = await Resume.findOne().sort({ resumeNo: -1 }).lean();
    let startNo = lastResume && !isNaN(lastResume.resumeNo) ? Number(lastResume.resumeNo) + 1 : 1;

    // 3. Process Files & Convert to Base64 (The Vercel Fix)
    const resumeEntries = await Promise.all(newFiles.map(async (file, index) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Convert buffer to a Base64 Data URI string
      const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

      return {
        resumeNo: startNo + index,
        uniqueId: crypto.randomUUID(),
        originalName: file.name,
        fileData: base64Data, // This replaces the physical file on disk
        fileUrl: "", // We can leave this empty or use it for frontend routing
        fileType: file.type || "application/pdf",
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        isAvailable: true,
        totalHits: 0,
        uploadedBy: adminId || null,
      };
    }));

    // 4. Save to DB (Atlas)
    await Resume.insertMany(resumeEntries);
    
    revalidatePath("/admin/upload");
    revalidatePath("/admin/resumes");

    return { 
      success: true, 
      count: newFiles.length, 
      duplicateCount: files.length - newFiles.length,
      totalSelected: files.length,
      message: `${newFiles.length} Resumes saved directly to Database Successfully.` 
    };

  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getResumes(page = 1, limit = 5, search = "") {
  try {
    await connectDB();
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { originalName: { $regex: search, $options: "i" } },
          { resumeNo: isNaN(search) ? undefined : Number(search) }
        ].filter(Boolean)
      };
    }

    const [resumes, total] = await Promise.all([
      // We use .select('-fileData') here to keep the list fetch fast. 
      // You only fetch fileData when you actually want to view the PDF.
      Resume.find(query).select('-fileData').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Resume.countDocuments(query)
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(resumes)),
      totalPages: Math.ceil(total / limit),
      totalResumes: total
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}