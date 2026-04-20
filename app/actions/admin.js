"use server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import ResumeInstance from "@/models/ResumeInstance";
import Kyc from "@/models/Kyc";
import { revalidatePath } from "next/cache";



// Admin dashboard ke sare users ko fetch karne ke liye ye function use hoga.
export async function getAllUsers() {
  try {
    await connectDB();

    // .select("-password") ensures security
    // .lean() makes the query faster by returning plain JS objects
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(users)),
      count: users.length
    };
  } catch (error) {
    console.error("Admin: Error fetching users ->", error);
    return {
      success: false,
      error: "Failed to fetch users directory."
    };
  }
}




//sare submitted reusmes ajynge data ke sath 
export async function getAdminReports(statusFilter = ["submitted", "approved", "rejected"]) {
  try {
    await connectDB();

    // Query: Sirf wahi status lao jo admin ne mange hain
    const query = {
      status: { $in: statusFilter }
    };

    const results = await ResumeInstance.find(query)
      .populate({
        path: "resumeId",
        select: "originalName fileUrl fileKey" // Resume se PDF URL aur naam
      })
      .populate({
        path: "userId",
        select: "name email" // User se naam aur email
      })
      .sort({ updatedAt: -1 }) // Latest updates sabse upar
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(results))
    };
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

//approve /reject in bulk resume 
export async function bulkUpdateResumeStatus(instanceIds, newStatus) {
  try {
    const validStatuses = ["default", "in-progress", "submitted", "pending", "approved", "rejected", "re-assigned"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status update requested");
    }

    await connectDB();

    // 1. Pehle saare instances fetch karo taaki userId aur oldStatus mil sake
    const instances = await ResumeInstance.find({ _id: { $in: instanceIds } });

    // 2. Har instance ke liye status update aur user stats sync karo
    const updatePromises = instances.map(async (inst) => {
      const oldStatus = inst.status;
      const userId = inst.userId;

      // Agar status same hai toh kuch mat karo
      if (oldStatus === newStatus) return;

      // Instance update
      inst.status = newStatus;
      inst.processedAt = new Date();
      await inst.save();

      // --- 🔥 STATS SYNC LOGIC ---
      const statsUpdate = {};

      // Purane status ka count -1 karo
      if (oldStatus && oldStatus !== "default") {
        statsUpdate[`stats.${oldStatus}Count`] = -1;
      }

      // Naye status ka count +1 karo
      if (newStatus && newStatus !== "default") {
        statsUpdate[`stats.${newStatus}Count`] = 1;
      }

      // User model mein atomic increment/decrement
      if (Object.keys(statsUpdate).length > 0) {
        await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
      }
    });

    await Promise.all(updatePromises);

    revalidatePath("/user");
    revalidatePath("/admin");

    return {
      success: true,
      message: `${instances.length} resumes updated and user stats synchronized.`
    };
  } catch (error) {
    console.error("Admin Bulk Update Error:", error);
    return { success: false, error: error.message };
  }
}


// 2. Fetch Approved Resumes and check availability for specific User
export async function getReassignableResumes(targetUserId) {
  try {
    await connectDB();

    // Pehle wo saare resumes lao jo Approved hain
    const approvedInstances = await ResumeInstance.find({ status: "approved" })
      .populate("resumeId", "originalName fileUrl")
      .lean();

    // Wo resumes nikalo jo target user pehle hi touch kar chuka hai
    const userTouchedResumes = await ResumeInstance.find({ userId: targetUserId })
      .select("resumeId")
      .lean();

    const touchedIds = userTouchedResumes.map(r => r.resumeId.toString());

    // Ab har resume ke saath "isLocked" flag bhejenge
    const processedData = approvedInstances.map(inst => ({
      ...inst,
      isLocked: touchedIds.includes(inst.resumeId._id.toString())
    }));

    return { success: true, data: JSON.parse(JSON.stringify(processedData)) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

//Final Reassign Action
export async function executeBulkReassign(targetUserId, sourceInstances) {
  try {
    await connectDB();

    // 1. New instances prepare karo
    const newInstances = sourceInstances.map(inst => ({
      resumeId: inst.resumeId._id,
      userId: targetUserId,
      formData: inst.formData,
      status: "re-assigned", // Special status for tracking
      isTouched: true,
      startedAt: new Date(),
    }));

    // 2. Database mein records insert karo
    await ResumeInstance.insertMany(newInstances);

    // --- 🔥 USER STATS SYNC ---
    // User ke assignedCount aur inProgressCount dono ko bulk mein update karo
    await User.findByIdAndUpdate(targetUserId, {
      $inc: {
        "stats.assignedCount": newInstances.length,
      }
    });

    revalidatePath("/user");
    revalidatePath("/admin");



    return {
      success: true,
      message: `Successfully re-assigned ${newInstances.length} resumes and updated user stats.`
    };
  } catch (error) {
    console.error("Bulk Re-assign Error:", error);
    return { success: false, error: error.message };
  }
}


//kyc routes hai ab 


export async function getAllKycRequests() {
  try {
    await connectDB();

    // Sabhi records fetch karo aur User details populate karo
    const requests = await Kyc.find({})
      .populate("userId", "name email role")
      .sort({ updatedAt: -1 }) // Latest updates top par
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(requests))
    };
  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
}


export async function updateComplianceStatus(kycId, type, status, remarks = "") {
  try {
    await connectDB();

    // 1. Pehle Kyc record update karo
    const updateKey = type === 'kyc' ? "documents.status" : "bankDetails.status";

    const updatedKyc = await Kyc.findByIdAndUpdate(kycId, {
      $set: {
        [updateKey]: status,
        adminRemarks: remarks,
        lastUpdated: new Date()
      }
    }, { new: true });

    if (!updatedKyc) throw new Error("KYC Record not found");

    // 2. ⚡ MANUAL SYNC: User Model ko update karo
    // Kyunki findOneAndUpdate middleware trigger nahi karta, hum yahan khud karenge
    const userUpdateKey = type === 'kyc' ? "kycStatus" : "bankDetailsStatus";

    await User.findByIdAndUpdate(updatedKyc.userId, {
      $set: { [userUpdateKey]: status }
    });

    console.log(`✅ Synced: User ${updatedKyc.userId} ${userUpdateKey} set to ${status}`);

    revalidatePath("/admin/kycreview");
    revalidatePath("/user/profile"); // User ki profile bhi refresh ho jaye

    return { success: true, message: `Status updated to ${status}` };
  } catch (error) {
    console.error("❌ Sync Error:", error.message);
    return { success: false, error: error.message };
  }
}