"use server";

import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary"; 
import crypto from "crypto";

export async function uploadBulkResumes(formData) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const adminId = cookieStore.get("userId")?.value;

    const files = formData.getAll("files");
    if (!files || files.length === 0) {
      return { success: false, error: "No files found in batch segment." };
    }

    // 1. Bulk verify existing duplicates by filename matching
    const existingFiles = await Resume.find({
      originalName: { $in: files.map(f => f.name) }
    }, { originalName: 1 }).lean();

    const existingFileNames = new Set(existingFiles.map((f) => f.originalName));
    const newFiles = files.filter((file) => !existingFileNames.has(file.name));

    if (newFiles.length === 0) {
      return {
        success: true,
        duplicateCount: files.length,
        count: 0,
        data: [],
        message: "Batch items already indexed in database.",
      };
    }

    // 2. Fetch the current sequence index counter
    const lastResume = await Resume.findOne().sort({ resumeNo: -1 }).lean();
    const startNo = lastResume && !isNaN(lastResume.resumeNo) ? Number(lastResume.resumeNo) + 1 : 1;

    // 3. Stream the 5-item micro-batch safely to Cloudinary
    const resumeEntries = await Promise.all(
      newFiles.map(async (file, index) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const cloudinaryResponse = await new Promise((resolve, reject) => {
          // ✅ FIXED: Isolate the upload stream initialization
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "Data_tech_resumes",
              resource_type: "raw", 
              public_id: `${Date.now()}-${file.name.replaceAll(" ", "_").split(".")[0]}.pdf`,
            },
            (error, result) => {
              if (error) {
                console.error("❌ Cloudinary stream write error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          
          // ✅ FIXED: Clear and explicit closure of the buffer pipeline stream
          uploadStream.end(buffer);
        });

        return {
          resumeNo: startNo + index,
          uniqueId: crypto.randomUUID(),
          originalName: file.name,
          fileUrl: cloudinaryResponse.secure_url,
          fileType: file.type || "application/pdf",
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
          isAvailable: true,
          totalHits: 0,
          uploadedBy: adminId || null,
        };
      })
    );

    // 4. Save metadata entries atomically to MongoDB
    const savedDocs = await Resume.insertMany(resumeEntries);

    revalidatePath("/admin/upload");
    revalidatePath("/admin/resumes");

    return {
      success: true,
      count: savedDocs.length,
      duplicateCount: files.length - newFiles.length,
      data: savedDocs.map((doc) => ({
        uniqueId: doc.uniqueId,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        resumeNo: doc.resumeNo,
      })),
    };
  } catch (error) {
    console.error("❌ BACKEND BATCH PIPE DROPPED:", error);
    return { success: false, error: error.message || "Unknown transmission crash." };
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
          { resumeNo: isNaN(search) ? undefined : Number(search) },
        ].filter(Boolean),
      };
    }

    const [resumes, total] = await Promise.all([
      Resume.find(query)
        .select("-fileData")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resume.countDocuments(query),
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(resumes)),
      totalPages: Math.ceil(total / limit),
      totalResumes: total,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
