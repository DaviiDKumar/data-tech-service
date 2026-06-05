"use server";

import connectDB from "@/lib/db";
import Kyc from "@/models/Kyc";
import mongoose from "mongoose"; // Isse ObjectId convert karenge
import { revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";
import { uploadToCloudinary } from "@/lib/cloudinary";
import User from "@/models/User";

export async function submitBankDetails(userId, bankPayload) {
  try {
    await connectDB();

    // DEBUG LOG 1: Check what exactly is arriving from the frontend
    console.log("🚀 [Incoming Payload]:", JSON.stringify(bankPayload, null, 2));

    if (!userId) throw new Error("User ID is missing");

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Prepare the update object
    const updateData = {
      userId: userObjectId,
      "bankDetails.data": {
        accountHolderName: bankPayload.accountHolderName,
        accountNumber: bankPayload.accountNumber,
        ifscCode: bankPayload.ifscCode,
        bankName: bankPayload.bankName,

        // DEBUG LOG 2: Monitor these specific values
        accountType: bankPayload.accountType || 'Savings',
        paymentMethod: bankPayload.paymentMethod || 'UPI',
        paymentMobile: bankPayload.paymentMobile,
      },
      "bankDetails.status": "pending",
      lastUpdated: new Date(),
    };

    // DEBUG LOG 3: Check the final object being sent to MongoDB
    console.log("📦 [Final DB Update Object]:", JSON.stringify(updateData, null, 2));

    const result = await Kyc.findOneAndUpdate(
      { userId: userObjectId },
      { $set: updateData },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    // DEBUG LOG 4: See exactly what MongoDB saved
    console.log("✅ [DB Saved Result]:", JSON.stringify(result.bankDetails.data, null, 2));

    revalidatePath("/user/profile");
    return {
      success: true,
      message: "Bank details submitted and are now pending verification."
    };
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

    // 1. Parallel media streaming loops over to Cloudinary bucket nodes
    const [idFileUrl, addrFileUrl] = await Promise.all([
      idFile && idFile.size > 0 ? uploadToCloudinary(idFile, userId, "id_proof") : null,
      addrFile && addrFile.size > 0 ? uploadToCloudinary(addrFile, userId, "address_proof") : null
    ]);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 2. ✅ FIX: Restructure nested keys directly instead of flattening via dots
    const updateData = {
      userId: userObjectId,
      documents: {
        status: "pending", // Shifting condition status parameters to pending for review
        idProof: {
          idType: formData.get("idType"),
          idNumber: formData.get("idNumber"),
          fileUrl: idFileUrl || formData.get("existingIdUrl"),
        },
        addressProof: {
          idType: formData.get("addressType"),
          idNumber: formData.get("addressNumber"),
          fileUrl: addrFileUrl || formData.get("existingAddrUrl"),
        }
      },
      lastUpdated: new Date(),
    };

    // 3. Commit update to your KYC collection tracker node
    const result = await Kyc.findOneAndUpdate(
      { userId: userObjectId },
      { $set: updateData },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    // 4. ✅ FIX: Run fallback status hook execution updates for findOneAndUpdate actions
    await User.findByIdAndUpdate(userObjectId, {
      kycStatus: "pending"
    });

    console.log("✅ KYC Sync Result:", result ? "Pending Review Updated" : "Failed");

    revalidatePath("/user/profile");
    return {
      success: true,
      message: "Identity and Address proof records submitted for validation."
    };

  } catch (error) {
    console.error("❌ KYC Submission Error:", error.message);
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