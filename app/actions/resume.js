"use server";
import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import fs from "fs/promises"; // File system module
import path from "path";

// resume upload karne ke liye ye function use hoga. 
// Ye function bulk upload ke liye bhi use hoga, isliye maine isme thoda flexibility rakha hai.
export async function uploadBulkResumes(formData) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const adminId = cookieStore.get('userId')?.value;

    const files = formData.getAll('files');
    if (!files || files.length === 0) return { success: false, error: "No files found." };

    // 1. Check/Create Uploads Folder
    const uploadDir = path.join(process.cwd(), "public/uploads");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const existingFiles = await Resume.find({}, { originalName: 1 }).lean();
    const existingFileNames = new Set(existingFiles.map(f => f.originalName));
    const newFiles = files.filter(file => !existingFileNames.has(file.name));

    if (newFiles.length === 0) {
      return { success: false, duplicateCount: files.length, totalSelected: files.length, message: "All files are duplicates." };
    }

    const lastResume = await Resume.findOne().sort({ resumeNo: -1 }).lean();
    let startNo = lastResume && !isNaN(lastResume.resumeNo) ? Number(lastResume.resumeNo) + 1 : 1;

    // 2. Process Files & Save them Physically
    const resumeEntries = await Promise.all(newFiles.map(async (file, index) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Save to public/uploads
      const filePath = path.join(uploadDir, file.name);
      await fs.writeFile(filePath, buffer);

      return {
        resumeNo: startNo + index,
        uniqueId: crypto.randomUUID(),
        originalName: file.name,
        fileUrl: `/uploads/${file.name}`, 
        fileType: file.type || "application/pdf",
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        isAvailable: true,
        totalHits: 0,
        uploadedBy: adminId || null,
      };
    }));

    // 3. Save to DB
    await Resume.insertMany(resumeEntries);
    revalidatePath("/admin/upload");
    revalidatePath("/admin/resumes");

    return { 
      success: true, 
      count: newFiles.length, 
      duplicateCount: files.length - newFiles.length,
      totalSelected: files.length,
      data: resumeEntries,
      message: `${newFiles.length} Resumes Uploaded & Saved Successfully.` 
    };

  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, error: error.message };
  }
}

//resume list ke liye ye function use hoga. 
//Ye pagination ke sath aayega taaki hum ek time par limited resumes hi fetch karein.
export async function getResumes(page = 1, limit = 5, search = "") {
  try {
    await connectDB();
    const skip = (page - 1) * limit;

    // Search filter: Original name ya Resume Number dono par search chalega
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
      Resume.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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