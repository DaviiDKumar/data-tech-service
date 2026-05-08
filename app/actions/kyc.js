"use server";

import connectDB from "@/lib/db";
import Kyc from "@/models/Kyc";
import mongoose from "mongoose"; // Isse ObjectId convert karenge
import { revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";
import { uploadToCloudinary } from "@/lib/cloudinary";


export async function submitBankDetails(userId, bankPayload) {
  try {
    await connectDB();

    if (!userId) throw new Error("User ID is missing");

    // String ID ko MongoDB ObjectId mein convert karna zaroori hai
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const updateData = {
      userId: userObjectId, // Ensure correct type
      "bankDetails.data": {
        accountHolderName: bankPayload.accountHolderName,
        accountNumber: bankPayload.accountNumber,
        ifscCode: bankPayload.ifscCode,
        bankName: bankPayload.bankName,
      },
      "bankDetails.status": "pending",
      lastUpdated: new Date(),
    };

    const result = await Kyc.findOneAndUpdate(
      { userId: userObjectId },
      { $set: updateData },
      { 
        upsert: true, 
        returnDocument: 'after', // Deprecation fix
        runValidators: true 
      }
    );

    console.log("✅ DB Result:", result ? "Created/Updated" : "Failed");

    revalidatePath("/user/profile");
    return { success: true, message: "Bank details updated successfully" };
  } catch (error) {
    console.error("❌ Bank Submission Error:", error.message);
    return { success: false, error: error.message };
  }
}




export async function submitKycWithFiles(userId, formData) {
  try {
    await connectDB();
    if (!userId) throw new Error("User ID is missing");

    const idFile = formData.get("idFile");
    const addrFile = formData.get("addrFile");

    // Parallel upload to Cloudinary for speed
    const [idFileUrl, addrFileUrl] = await Promise.all([
      uploadToCloudinary(idFile, userId, "id_proof"),
      uploadToCloudinary(addrFile, userId, "address_proof")
    ]);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const updateData = {
      userId: userObjectId,
      "documents.idProof": {
        idType: formData.get("idType"),
        idNumber: formData.get("idNumber"),
        fileUrl: idFileUrl || formData.get("existingIdUrl"),
      },
      "documents.addressProof": {
        idType: formData.get("addressType"),
        idNumber: formData.get("addressNumber"),
        fileUrl: addrFileUrl || formData.get("existingAddrUrl"),
      },
      "documents.status": "pending",
      lastUpdated: new Date(),
    };

    // Upsert logic: Create if new, update if exists
    await Kyc.findOneAndUpdate(
      { userId: userObjectId }, 
      { $set: updateData }, 
      { upsert: true, runValidators: true }
    );

    revalidatePath("/user/profile");
    return { success: true, message: "KYC Documents securely stored in Cloudinary." };

  } catch (error) {
    console.error("KYC Submission Error:", error);
    return { success: false, error: error.message };
  }
}


export async function getKycRecord(userId) {
    try {
      await connectDB();
      // Yahan hum database se fresh data nikaal rahe hain
      const record = await Kyc.findOne({ userId }).lean();
      
      if (!record) return { success: true, data: null };

      return { success: true, data: JSON.parse(JSON.stringify(record)) };
    } catch (error) {
      console.error("Get KYC Error:", error);
      return { success: false, error: error.message };
    }
}