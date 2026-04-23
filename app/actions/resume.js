"use server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary"


export async function uploadBulkResumes(formData) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const adminId = cookieStore.get('userId')?.value;

    const files = formData.getAll('files');
    if (!files || files.length === 0) return { success: false, error: "No files found." };

    // 1. Prevent Duplicates based on Filename (Same as before)
    const existingFiles = await Resume.find({}, { originalName: 1 }).lean();
    const existingFileNames = new Set(existingFiles.map(f => f.originalName));
    const newFiles = files.filter(file => !existingFileNames.has(file.name));

    if (newFiles.length === 0) {
      return {
        success: false,
        duplicateCount: files.length,
        message: "All selected files already exist in the database."
      };
    }

    // 2. Get Starting Resume Number
    const lastResume = await Resume.findOne().sort({ resumeNo: -1 }).lean();
    let startNo = lastResume && !isNaN(lastResume.resumeNo) ? Number(lastResume.resumeNo) + 1 : 1;

    // 3. Process and Upload to Cloudinary
    const resumeEntries = await Promise.all(newFiles.map(async (file, index) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary using a Promise
      const cloudinaryResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "Data_tech_resumes",
            resource_type: "image",
            // This tells Cloudinary: "I know I said image, but treat it as a PDF"
            format: "pdf",
            flags: "attachment:false", // Force it NOT to be a download
            public_id: `${Date.now()}-${file.name.replaceAll(" ", "_").split('.')[0]}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      return {
        resumeNo: startNo + index,
        uniqueId: crypto.randomUUID(),
        originalName: file.name,
        fileData: "Cloudinary Hosted",
        fileUrl: cloudinaryResponse.secure_url, // URL from Cloudinary
        fileType: file.type || "application/pdf",
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        isAvailable: true,
        totalHits: 0,
        uploadedBy: adminId || null,
        cloudinary_id: cloudinaryResponse.public_id, // Store this to delete later if needed
      };
    }));

    // 4. Save Metadata to Atlas
    const savedDocs = await Resume.insertMany(resumeEntries);

    revalidatePath("/admin/upload");
    revalidatePath("/admin/resumes");

    return {
      success: true,
      count: savedDocs.length,
      duplicateCount: files.length - newFiles.length,
      totalSelected: files.length,
      data: JSON.parse(JSON.stringify(savedDocs)),
      message: `${savedDocs.length} Resumes uploaded to Cloudinary & saved successfully.`
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