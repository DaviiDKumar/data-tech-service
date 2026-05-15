"use server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import ResumeInstance from "@/models/ResumeInstance";
import Kyc from "@/models/Kyc";
import { revalidatePath } from "next/cache";
import Resume from "@/models/Resume";



// Admin dashboard ke sare users ko fetch karne ke liye ye function use hoga.
export async function getAllUsers() {
  try {
    await connectDB();

    // .select("-password") ensures security
    // .lean() makes the query faster by returning plain JS objects
    const users = await User.find({ role: "user" })

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


/**
 * Update User Access: Deactivate, Extend Time, or Set Fixed End Date
 * @param {string} userId - Target user's MongoDB ID
 * @param {object} updates - { isActive, daysToAdd, fixedEndDate }
 */
export async function manageUserAccess(userId, updates) {
  try {
    await connectDB();

    // 1. Fetch the user to get current endDate for relative calculations
    const user = await User.findById(userId);
    if (!user) return { success: false, message: "User not found" };

    let updateFields = {};

    // A. Toggle Active Status
    if (typeof updates.isActive !== 'undefined') {
      updateFields.isActive = updates.isActive;
    }

    // B. Relative Extension (Add X days to current end date)
    if (updates.daysToAdd) {
      const currentEnd = new Date(user.endDate || new Date());
      currentEnd.setDate(currentEnd.getDate() + updates.daysToAdd);
      updateFields.endDate = currentEnd;
    }

    // C. Absolute Update (Set specific date)
    if (updates.fixedEndDate) {
      updateFields.endDate = new Date(updates.fixedEndDate);
    }

    // 2. Perform the update
    await User.findByIdAndUpdate(userId, { $set: updateFields });

    // 3. Clear Cache for the Admin and User pages
    revalidatePath("/admin/users");
    revalidatePath(`/admin/user/${userId}`);

    return {
      success: true,
      message: "User access parameters updated successfully."
    };

  } catch (error) {
    console.error("Admin Access Update Error:", error);
    return { success: false, message: error.message };
  }
}



//sare submitted reusmes ajynge data ke sath 
export async function getAdminReports(statusFilter = ["submitted", "approved", "rejected", "review"]) {
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
    const validStatuses = ["default", "in-progress", "submitted", "pending", "approved", "rejected", "re-assigned", "review"];
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

    // 1. Get all unique Resume IDs that have been approved by anyone in the system
    const approvedInstances = await ResumeInstance.find({ status: "approved" })
      .populate("resumeId", "originalName fileUrl")
      .lean();

    // 2. Get all resumes already handled by the target user (submitted, rejected, etc.)
    const userExistingInstances = await ResumeInstance.find({ userId: targetUserId })
      .select("resumeId")
      .lean();

    // Create a Set of IDs for O(1) lookup performance
    const touchedResumeIds = new Set(
      userExistingInstances.map(inst => inst.resumeId.toString())
    );

    // 3. Process the data
    const processedData = approvedInstances.map(inst => {
      const resumeIdStr = inst.resumeId._id.toString();

      return {
        ...inst,
        // LOCK only if this specific Resume ID is already in the target user's history
        isLocked: touchedResumeIds.has(resumeIdStr)
      };
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(processedData))
    };
  } catch (error) {
    console.error("Fetch Reassignable Error:", error);
    return { success: false, error: error.message };
  }
}
//Final Reassign Action
export async function executeBulkReassign(targetUserId, sourceInstances) {
  try {
    await connectDB();

    // 1. Filter out any instances that might have been tampered with or are duplicates
    const newInstances = sourceInstances.map(inst => ({
      resumeId: inst.resumeId._id,
      userId: targetUserId,
      formData: inst.formData, // Pre-filled data from the approved source
      status: "re-assigned",
      isTouched: true,
      startedAt: new Date(),
    }));

    // 2. Bulk Insert
    if (newInstances.length > 0) {
      await ResumeInstance.insertMany(newInstances);

      // 3. Update User Stats
      await User.findByIdAndUpdate(targetUserId, {
        $inc: {
          "stats.assignedCount": newInstances.length,
          // We increment inProgress because re-assigned items 
          // usually appear in the user's active workspace
          "stats.inProgressCount": newInstances.length
        }
      });
    }

    revalidatePath("/admin/reassign");
    revalidatePath("/user/dashboard");

    return {
      success: true,
      message: `Successfully allocated ${newInstances.length} resumes.`
    };
  } catch (error) {
    console.error("Bulk Re-assign Error:", error);
    // Handle Duplicate Key Error (Index: resumeId_1_userId_1)
    if (error.code === 11000) {
      return { success: false, error: "One or more resumes are already assigned to this user." };
    }
    return { success: false, error: error.message };
  }
}

//kyc routes hai ab 


export async function getAllKycRequests() {
  try {
    await connectDB();

    // Fix: Add loginId inside the fields string (second argument)
    const requests = await Kyc.find({})
      .populate("userId", "name email role loginId") 
      .sort({ updatedAt: -1 })
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
// kyc stsus update krega
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




// stsuts fetch krega
export async function fetchAdminLiveStats() {
  try {
    await connectDB();

    // After connectDB()
    const totalUploadedResumes = await Resume.countDocuments();
    // Existing aggregate
    const result = await ResumeInstance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          appr: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          rejt: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
          revw: { $sum: { $cond: [{ $eq: ["$status", "review"] }, 1, 0] } },
          prog: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
          subm: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } },
        }
      }
    ]);

    const data = result[0] || { total: 0, appr: 0, rejt: 0, revw: 0, prog: 0, subm: 0 };

    // ✅ NEW: 7-day chart data (group by day, count resumes created)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const chartRaw = await ResumeInstance.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days with 0
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const found = chartRaw.find(r => r._id === key);
      chartData.push({ date: key, count: found?.count ?? 0 });
    }

    // ✅ NEW: Action History — last 10 approved/rejected changes
    const actionHistoryRaw = await ResumeInstance.find(
      { status: { $in: ["approved", "rejected"] } },
      { status: 1, updatedAt: 1, userId: 1, resumeId: 1 }
    )
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    // ✅ Serialize all ObjectIds and Dates to plain strings
    const actionHistory = actionHistoryRaw.map((item) => ({
      id: item._id.toString(),
      resumeId: item.resumeId?.toString() ?? "",
      userId: item.userId?.toString() ?? "",
      status: item.status,
      updatedAt: item.updatedAt?.toISOString() ?? "",
    }));
    // ✅ NEW: Latency check
    const latencyStart = Date.now();
    await ResumeInstance.findOne({}).lean();
    const latency = Date.now() - latencyStart;

    const usersCount = await User.countDocuments({ role: 'user' });
    const finalized = data.appr + data.rejt;
    const accuracy = finalized > 0 ? Math.round((data.appr / finalized) * 100) : 0;

    return {
      success: true,
      totalUploaded: totalUploadedResumes,
      totalResumes: data.total,
      approved: data.appr,
      rejected: data.rejt,
      saved: data.saved,
      inProgress: data.prog,
      pending: data.subm,
      globalAccuracy: accuracy,
      activeUsersCount: usersCount,
      chartData,          // ✅ 7-day trend
      latency,            // ✅ ms response time
      actionHistory,      // ✅ recent status changes
      // dbUsage: you must get this from MongoDB Atlas Admin API (see note below)
    };
  } catch (err) {
    console.error("Action Error:", err);
    return { success: false, error: err.message };
  }
}

// auto saved wla 

export async function getAdminSavedResumes(statusFilter = ["saved", "in-progress", "re-assigned", "review"]) {
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
