"use server";

import connectDB from "@/lib/db";
import Kyc from "@/models/Kyc";
import mongoose from "mongoose"; // Isse ObjectId convert karenge
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";



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

    const idFile = formData.get("idFile");
    const addrFile = formData.get("addrFile");
    const idNumber = formData.get("idNumber");
    const idType = formData.get("idType");

    // 1. Create Directory if not exists
    const uploadDir = path.join(process.cwd(), "public/kyc");
    await fs.mkdir(uploadDir, { recursive: true });

    let idFileUrl = "";
    let addrFileUrl = "";

    // 2. Save ID Proof File
    if (idFile && idFile.size > 0) {
      const idFileName = `${userId}_id_${Date.now()}_${idFile.name}`;
      const buffer = Buffer.from(await idFile.arrayBuffer());
      await fs.writeFile(path.join(uploadDir, idFileName), buffer);
      idFileUrl = `/kyc/${idFileName}`; // Public URL
    }

    // 3. Save Address Proof File
    if (addrFile && addrFile.size > 0) {
      const addrFileName = `${userId}_addr_${Date.now()}_${addrFile.name}`;
      const buffer = Buffer.from(await addrFile.arrayBuffer());
      await fs.writeFile(path.join(uploadDir, addrFileName), buffer);
      addrFileUrl = `/kyc/${addrFileName}`;
    }

    // 4. Update Database
    const updateData = {
      userId,
      "documents.idProof": {
        idType,
        idNumber,
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

    await Kyc.findOneAndUpdate({ userId }, { $set: updateData }, { upsert: true });

    revalidatePath("/user/profile");
    return { success: true, message: "Files saved to local storage & DB updated!" };

  } catch (error) {
    console.error("Upload Error:", error);
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