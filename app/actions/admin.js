// app/actions/admin.js
"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import Resume from "@/models/Resume";
import ResumeInstance from "@/models/ResumeInstance";
import Kyc from "@/models/Kyc";
import { revalidatePath } from "next/cache";

/**
 * Fetch users directory safely with projection
 */
export async function getAllUsers() {
  try {
    await connectDB();

    // Projected search excludes unrequired attributes to speed up data transmission
    const users = await User.find({ role: "user" })
      .select("name email phone loginId password isActive startDate endDate kycStatus bankDetailsStatus stats createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(users)),
      count: users.length
    };
  } catch (error) {
    console.error("Admin: Error fetching users ->", error);
    return { success: false, error: "Failed to fetch users directory directory node." };
  }
}

/**
 * Master Access and Project Timeline Duration Manager
 */
export async function manageUserAccess(userId, updates) {
  try {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) return { success: false, message: "Target user node not located." };

    let updateFields = {};

    if (typeof updates.isActive !== 'undefined') {
      updateFields.isActive = updates.isActive;
    }

    if (updates.daysToAdd) {
      const currentEnd = new Date(user.endDate || new Date());
      currentEnd.setDate(currentEnd.getDate() + updates.daysToAdd);
      updateFields.endDate = currentEnd;
    }

    if (updates.fixedEndDate) {
      updateFields.endDate = new Date(updates.fixedEndDate);
    }

    await User.findByIdAndUpdate(userId, { $set: updateFields });

    revalidatePath("/admin/users");
    return { success: true, message: "User access parameters updated successfully." };
  } catch (error) {
    console.error("Admin Access Update Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Get Submitted Reports with explicit limits to prevent backend memory leaks
 */
export async function getAdminReports(statusFilter = ["submitted", "approved", "rejected", "review"]) {
  try {
    await connectDB();

    const results = await ResumeInstance.find({ status: { $in: statusFilter } })
      .populate("resumeId", "originalName fileUrl")
      .populate("userId", "name email loginId")
      .sort({ updatedAt: -1 })
      .limit(200) // Safety boundary limit wraps buffer memory leaks securely
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * High-Speed Bulk Status Updates with combined user statistics syncing
 */
export async function bulkUpdateResumeStatus(instanceIds, newStatus) {
  try {
    const validStatuses = ["default", "in-progress", "submitted", "pending", "approved", "rejected", "re-assigned", "review"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status update requested");
    }

    await connectDB();

    const instances = await ResumeInstance.find({ _id: { $in: instanceIds } });
    if (!instances.length) return { success: false, error: "No target instances located." };

    // Group statistical mutations by user to combine database writes efficiently
    const userStatsMap = {};

    for (const inst of instances) {
      const oldStatus = inst.status;
      const uId = inst.userId.toString();

      if (oldStatus === newStatus) continue;

      inst.status = newStatus;
      inst.processedAt = new Date();
      await inst.save();

      if (!userStatsMap[uId]) {
        userStatsMap[uId] = {};
      }

      if (oldStatus && oldStatus !== "default") {
        userStatsMap[uId][`stats.${oldStatus}Count`] = (userStatsMap[uId][`stats.${oldStatus}Count`] || 0) - 1;
      }
      if (newStatus && newStatus !== "default") {
        userStatsMap[uId][`stats.${newStatus}Count`] = (userStatsMap[uId][`stats.${newStatus}Count`] || 0) + 1;
      }
    }

    // Process all modifications sequentially via a unified write process
    const userUpdates = Object.keys(userStatsMap).map(uId => {
      const increments = userStatsMap[uId];
      if (Object.keys(increments).length === 0) return Promise.resolve();
      return User.findByIdAndUpdate(uId, { $inc: increments });
    });

    await Promise.all(userUpdates);

    revalidatePath("/user");
    revalidatePath("/admin");

    return { success: true, message: `${instances.length} instances processed across synchronized terminals.` };
  } catch (error) {
    console.error("Admin Bulk Update Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Pull Unique Reassignable Resumes safely
 */
export async function getReassignableResumes(targetUserId) {
  try {
    await connectDB();

    // 1. Fetch approved instances and populate BOTH the resume files AND the original submitter profile nodes
    const approvedInstances = await ResumeInstance.find({ status: "approved" })
      .populate("resumeId", "originalName fileUrl")
      .populate("userId", "name email loginId") // ⚡ THE FIX: Pulls the submitter's identity data straight from the User schema collection
      .lean();

    // 2. Locate what the target user has already touched to calculate the lockouts
    const userExistingInstances = await ResumeInstance.find({ userId: targetUserId })
      .select("resumeId")
      .lean();

    const touchedResumeIds = new Set(
      userExistingInstances.map(inst => inst.resumeId?.toString()).filter(Boolean)
    );

    // 3. Filter duplicates using our strict Map structure to keep layouts clean
    const uniqueMap = new Map();
    for (const inst of approvedInstances) {
      if (!inst.resumeId?._id) continue;
      const rIdStr = inst.resumeId._id.toString();

      if (!uniqueMap.has(rIdStr)) {
        uniqueMap.set(rIdStr, {
          ...inst,
          isLocked: touchedResumeIds.has(rIdStr)
        });
      }
    }

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(Array.from(uniqueMap.values()))) 
    };
  } catch (error) {
    console.error("Fetch Reassignable Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute Bulk Assignment Actions safely
 */
export async function executeBulkReassign(targetUserId, sourceInstances) {
  try {
    await connectDB();

    const newInstances = sourceInstances.map(inst => ({
      resumeId: inst.resumeId?._id || inst.resumeId,
      userId: targetUserId,
      formData: inst.formData || {},
      status: "re-assigned", // Parked as re-assigned cleanly
      isTouched: true,
      startedAt: new Date(),
    })).filter(inst => inst.resumeId);

    if (newInstances.length > 0) {
      await ResumeInstance.insertMany(newInstances);

      // ✅ FIXED HERE: Completely removed stats.inProgressCount from this increment block!
      await User.findByIdAndUpdate(targetUserId, {
        $inc: {
          "stats.assignedCount": newInstances.length
        }
      });
    }

    revalidatePath("/admin/reassign");
    revalidatePath("/user");

    return { success: true, message: `Successfully allocated ${newInstances.length} resumes.` };
  } catch (error) {
    console.error("Bulk Re-assign Error:", error);
    if (error.code === 11000) {
      return { success: false, error: "One or more resumes are already assigned to this user." };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Fetch Compliance Requests Directory Node Data
 */
export async function getAllKycRequests() {
  try {
    await connectDB();
    const requests = await Kyc.find({})
      .populate("userId", "name email role loginId")
      .sort({ updatedAt: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(requests)) };
  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Synchronize Compliance States directly
 */
// app/actions/admin.js

/**
 * High-Performance Compliance Sync Engine
 * @param {string} kycId - Target collection validation tracker token
 * @param {string} type - Field discriminator ('kyc' | 'bank')
 * @param {string} status - Targeted validation state enum ('verified' | 'rejected')
 * @param {string} remarks - Evaluation notes outlining context updates
 */
export async function updateComplianceStatus(kycId, type, status, remarks = "") {
  try {
    await connectDB();

    const updateKey = type === 'kyc' ? "documents.status" : "bankDetails.status";

    // 1. Update the master compliance transaction ledger atomically
    const updatedKyc = await Kyc.findByIdAndUpdate(
      kycId,
      {
        $set: {
          [updateKey]: status,
          adminRemarks: remarks?.trim() || "",
          lastUpdated: new Date()
        }
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedKyc) {
      return { success: false, error: "Target compliance tracking document node not found." };
    }

    const userUpdateKey = type === 'kyc' ? "kycStatus" : "bankDetailsStatus";

    // 2. Synchronize and apply updated status directly to the user record fields
    const updatedUser = await User.findByIdAndUpdate(
      updatedKyc.userId,
      { $set: { [userUpdateKey]: status } },
      { new: true }
    ).select("kycStatus bankDetailsStatus stats name email").lean();

    if (!updatedUser) {
      return { success: false, error: "Associated workspace agent profile node could not be verified." };
    }

    // 3. Purge edge routing network cache paths on the next server ticks
    revalidatePath("/admin/kycreview");
    revalidatePath("/user/profile");

    // 4. ✅ RETURN THE FRESH PARAMETERS FOR DIRECT CLIENT STORE HYDRATION
    return {
      success: true,
      message: `System node verified compliance change to ${status.toUpperCase()}.`,
      updatedFields: {
        kycStatus: updatedUser.kycStatus,
        bankDetailsStatus: updatedUser.bankDetailsStatus,
        // Passing these down guarantees the admin table state matches your db completely
      }
    };
  } catch (error) {
    console.error("❌ Critical Compliance Sync Fault:", error.message);
    return { success: false, error: "Internal transaction bridge dropped your request context." };
  }
}
/**
 * Core Live Analytics Node Aggregator pipeline calculation tracking functions
 */
export async function fetchAdminLiveStats() {
  try {
    await connectDB();

    const totalUploadedResumes = await Resume.countDocuments();

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
          saved: { $sum: { $cond: [{ $eq: ["$status", "saved"] }, 1, 0] } },
          skip: { $sum: { $cond: [{ $eq: ["$status", "skipped"] }, 1, 0] } },
        }
      }
    ]);

    const data = result[0] || { total: 0, appr: 0, rejt: 0, revw: 0, prog: 0, subm: 0, saved: 0, skip: 0 };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const chartRaw = await ResumeInstance.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: "skipped" }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const found = chartRaw.find(r => r._id === key);
      chartData.push({ date: key, count: found?.count ?? 0 });
    }

    const actionHistoryRaw = await ResumeInstance.find(
      { status: { $in: ["approved", "rejected"] } },
      { status: 1, updatedAt: 1, userId: 1, resumeId: 1 }
    )
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const actionHistory = actionHistoryRaw.map((item) => ({
      id: item._id.toString(),
      resumeId: item.resumeId?.toString() ?? "",
      userId: item.userId?.toString() ?? "",
      status: item.status,
      updatedAt: item.updatedAt?.toISOString() ?? "",
    }));

    const latencyStart = Date.now();
    await ResumeInstance.findOne({}).select("_id").lean();
    const latency = Date.now() - latencyStart;

    const usersCount = await User.countDocuments({ role: 'user' });
    const finalized = data.appr + data.rejt;
    const accuracy = finalized > 0 ? Math.round((data.appr / finalized) * 100) : 0;

    const adjustedTotalInstances = Math.max(0, data.total - data.skip);

    return {
      success: true,
      totalUploaded: totalUploadedResumes,
      totalResumes: adjustedTotalInstances,
      approved: data.appr,
      rejected: data.rejt,
      saved: data.saved,
      inProgress: data.prog,
      pending: data.subm,
      skipped: data.skip,
      globalAccuracy: accuracy,
      activeUsersCount: usersCount,
      chartData,
      latency,
      actionHistory,
    };
  } catch (err) {
    console.error("Action Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Pull Auto Saved and Parked items cleanly
 */
export async function getAdminSavedResumes(statusFilter = ["saved", "in-progress", "re-assigned", "review"]) {
  try {
    await connectDB();

    const results = await ResumeInstance.find({ status: { $in: statusFilter } })
      .populate("resumeId", "originalName fileUrl")
      .populate("userId", "name email")
      .sort({ updatedAt: -1 })
      .limit(200) // Wraps data boundaries cleanly
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return { success: false, error: error.message };
  }
}