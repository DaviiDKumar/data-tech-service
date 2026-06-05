"use server";

import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import User from "@/models/User";
import ResumeInstance from "@/models/ResumeInstance";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

/**
 * User ke liye resumes fetch karne ka server action with Smart Expiry Guards
 */
export async function getResumesForUser(page = 1, limit = 8, userId) {
    try {
        await connectDB();

        const user = await User.findById(userId).select('endDate role').lean();
        if (!user) return { success: false, error: "User not found" };

        const now = new Date();
        const expiry = new Date(user.endDate);
        expiry.setHours(23, 59, 59, 999);
        const isExpired = now > expiry && user.role !== "admin";

        const skip = (page - 1) * limit;

        const resumes = await Resume.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Resume.countDocuments({});

        const userInstances = await ResumeInstance.find({ userId })
            .select('resumeId status')
            .lean();

        const mappedData = resumes.map(res => {
            const instance = userInstances.find(inst => inst.resumeId.toString() === res._id.toString());
            let status = instance ? instance.status : 'available';

            if (isExpired && status === 'available') {
                status = 'locked';
            }

            return {
                ...res,
                workStatus: status,
            };
        });

        return {
            success: true,
            data: JSON.parse(JSON.stringify(mappedData)),
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        };
    } catch (error) {
        console.error("Fetch Error:", error);
        return { success: false, error: "Failed to fetch pool" };
    }
}

/**
 * Automatically assigns an available resume, enforcing timeline lockouts
 */
export async function autoAssignAndGetId(userId) {
    try {
        await connectDB();

        const user = await User.findById(userId).select('endDate role').lean();
        if (!user) return { success: false, error: "User profile not found." };

        const now = new Date();
        const expiry = new Date(user.endDate);
        expiry.setHours(23, 59, 59, 999);

        if (now > expiry && user.role !== "admin") {
            return {
                success: false,
                error: "Project Timeline Completed. New assignments are locked."
            };
        }

        const existingTask = await ResumeInstance.findOne({
            userId,
            status: "in-progress"
        });

        if (existingTask) {
            return { success: true, resumeId: existingTask.resumeId.toString() };
        }

        const workedResumes = await ResumeInstance.find({ userId }).distinct('resumeId');

        const nextResume = await Resume.findOne({
            isAvailable: true,
            _id: { $nin: workedResumes }
        });

        if (!nextResume) {
            return { success: false, error: "All resumes completed!" };
        }

        await Promise.all([
            ResumeInstance.create({
                userId,
                resumeId: nextResume._id,
                status: "in-progress",
                formData: {}
            }),
            User.findByIdAndUpdate(userId, {
                $inc: { "stats.inProgressCount": 1 }
            }),
            Resume.findByIdAndUpdate(nextResume._id, {
                $inc: { totalHits: 1 }
            })
        ]);

        revalidatePath("/user");
        return { success: true, resumeId: nextResume._id.toString() };

    } catch (error) {
        console.error("Auto-assign error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Increment master resume visual hit counters
 */
export async function incrementResumeHits(resumeId) {
    try {
        await connectDB();
        await Resume.findByIdAndUpdate(resumeId, {
            $inc: { totalHits: 1 }
        });
        return { success: true };
    } catch (error) {
        console.error("Error incrementing hits:", error);
        return { success: false };
    }
}

/**
 * Explicit Hold & Save action to park a resume out of active queues
 */
export async function holdAndSaveResume(resumeId, userId, data) {
    try {
        await connectDB();

        if (!userId) throw new Error("User ID parameter is missing");
        if (!resumeId) throw new Error("Resume ID parameter is missing");

        const [existingDoc, userDoc] = await Promise.all([
            ResumeInstance.findOne({ resumeId, userId }).lean(),
            User.findById(userId).select("stats").lean()
        ]);

        const oldStatus = existingDoc ? existingDoc.status : 'default';
        const currentStats = userDoc?.stats || {};

        await ResumeInstance.findOneAndUpdate(
            { resumeId, userId },
            {
                $set: {
                    formData: data || {},
                    status: 'saved',
                    isTouched: true,
                    updatedAt: new Date()
                },
                $inc: { revisionCount: 1 }
            },
            { upsert: true, new: true }
        );

        if (oldStatus !== 'saved') {
            const incOps = { "stats.savedCount": 1 };

            if (oldStatus === 'in-progress' || oldStatus === 're-assigned') {
                if (currentStats.inProgressCount > 0) {
                    incOps["stats.inProgressCount"] = -1;
                }
            } else if (oldStatus === 'rejected' && currentStats.rejectedCount > 0) {
                incOps["stats.rejectedCount"] = -1;
            }

            await User.findByIdAndUpdate(userId, { $inc: incOps });
        }

        const updatedUser = await User.findById(userId).select("stats").lean();

        revalidatePath("/user");

        return {
            success: true,
            message: "Resume parked in 'Saved' list successfully.",
            newData: { stats: updatedUser.stats }
        };

    } catch (error) {
        console.error("❌ HOLD/SAVE ERROR:", error.message);
        return { success: false, error: error.message || "Failed to update ledger records." };
    }
}

/**
 * Finalizes form payload submissions, updating stats atomically
 */
export async function submitResume(resumeId, userId, data) {
    try {
        await connectDB();

        const [currentDoc, userDoc] = await Promise.all([
            ResumeInstance.findOne({ resumeId, userId }).lean(),
            User.findById(userId).select("stats kycStatus bankDetailsStatus").lean()
        ]);

        const oldStatus = currentDoc ? currentDoc.status : null;
        const currentStats = userDoc?.stats || {};
        const statsUpdate = {};

        await ResumeInstance.findOneAndUpdate(
            { resumeId, userId },
            {
                $set: {
                    formData: data,
                    status: 'submitted',
                    submittedAt: new Date(),
                    isTouched: true
                },
                $inc: { revisionCount: 1 }
            },
            { upsert: true }
        );

        if (oldStatus !== 'submitted') {
            statsUpdate["stats.submittedCount"] = 1;

            if (oldStatus === 're-assigned' && currentStats.assignedCount > 0) {
                statsUpdate["stats.assignedCount"] = -1;
            }
            else if (oldStatus === 'in-progress' && currentStats.inProgressCount > 0) {
                statsUpdate["stats.inProgressCount"] = -1;
            }
            else if (oldStatus === 'review' && currentStats.reviewCount > 0) {
                statsUpdate["stats.reviewCount"] = -1;
            }
            else if (oldStatus === 'rejected' && currentStats.rejectedCount > 0) {
                statsUpdate["stats.rejectedCount"] = -1;
            }
            else if (oldStatus === 'saved' && currentStats.savedCount > 0) {
                statsUpdate["stats.savedCount"] = -1;
            }
        }

        if (Object.keys(statsUpdate).length > 0) {
            await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
        }

        const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const localIstDate = new Date(istString);

        const startOfToday = new Date(
            localIstDate.getFullYear(),
            localIstDate.getMonth(),
            localIstDate.getDate(),
            0, 0, 0, 0
        );

        const todayCount = await ResumeInstance.countDocuments({
            userId,
            status: { $in: ["submitted", "saved", "approved", "re-assigned", "review"] },
            updatedAt: { $gte: startOfToday }
        });

        const updatedUser = await User.findById(userId).select("stats kycStatus bankDetailsStatus").lean();

        revalidatePath("/user");

        return {
            success: true,
            newData: {
                stats: {
                    ...updatedUser.stats,
                    todayCompletedCount: todayCount
                },
                kycStatus: updatedUser.kycStatus,
                bankDetailsStatus: updatedUser.bankDetailsStatus
            }
        };

    } catch (error) {
        console.error("❌ SUBMIT RESUME SYSTEM ERROR:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getSubmittedResumes(userId) {
    try {
        await connectDB();
        const results = await ResumeInstance.find({
            userId,
            status: { $in: ['submitted', 'pending', 'approved', 'rejected'] }
        })
            .populate('resumeId', 'originalName')
            .sort({ submittedAt: -1 })
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(results)) };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getInProgressResumes(userId) {
    try {
        await connectDB();
        const results = await ResumeInstance.find({
            userId,
            status: 'in-progress'
        })
            .populate('resumeId', 'originalName')
            .sort({ updatedAt: -1 })
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(results)) };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Workspace fetch engine with automatic live state re-balancing logic
 */
/**
 * Workspace fetch engine with automatic live state re-balancing logic
 * FIXED: Safely flattens Mongoose Map structures into plain serializable objects
 */
export async function getWorkspaceData(resumeId, userId) {
    try {
        if (!resumeId || resumeId === "undefined") return { success: false, error: "Invalid ID" };

        await connectDB();

        const [resume, instance, user] = await Promise.all([
            Resume.findById(resumeId).lean(),
            ResumeInstance.findOne({ resumeId, userId }), // Removed .lean() here to safely work with the instance doc methods
            User.findById(userId)
        ]);

        if (!resume || !user) return { success: false, error: "Data not found" };

        const now = new Date();
        const expiry = new Date(user.endDate);
        expiry.setHours(23, 59, 59, 999);

        if (!user.isActive || (now > expiry && user.role !== "admin")) {
            return {
                success: false,
                error: "ACCESS_DENIED",
                message: "Project timeline completed. This workspace is locked."
            };
        }

        // Automatic live state counter ledger re-balancing on load
        if (instance && (instance.status === 'saved' || instance.status === 're-assigned' || instance.status === 'rejected')) {
            const oldStatus = instance.status;
            
            instance.status = 'in-progress';
            await instance.save();

            const statsUpdate = { "stats.inProgressCount": 1 };
            
            if (oldStatus === 'saved' && user.stats.savedCount > 0) {
                statsUpdate["stats.savedCount"] = -1;
            } else if (oldStatus === 're-assigned' && user.stats.assignedCount > 0) {
                statsUpdate["stats.assignedCount"] = -1;
            } else if (oldStatus === 'rejected' && user.stats.rejectedCount > 0) {
                statsUpdate["stats.rejectedCount"] = -1;
            }

            await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
        }

        // ⚡ SERIALIZATION FIX: Convert Mongoose Map to Plain Object cleanly
        let plainFormData = null;
        if (instance?.formData) {
            plainFormData = instance.formData instanceof Map 
                ? Object.fromEntries(instance.formData) // Converts Map to plain structure {}
                : JSON.parse(JSON.stringify(instance.formData)); // Fallback sanity check
        }

        return {
            success: true,
            data: { 
                ...JSON.parse(JSON.stringify(resume)), 
                formData: plainFormData // ✅ Safe serialization across wire boundary
            }
        };
    } catch (error) {
        console.error("Workspace Serialization Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getReassignedResumes(userId) {
    try {
        await connectDB();
        const results = await ResumeInstance.find({
            userId,
            status: { $in: ["re-assigned", "saved", "review"] }
        })
            .populate("resumeId", "originalName fileUrl")
            .sort({ updatedAt: -1 })
            .lean();
        return { success: true, data: JSON.parse(JSON.stringify(results)) };
    } catch (error) {
        console.error("User: Error fetching re-assigned resumes ->", error);
        return { success: false, error: error.message };
    }
}

export async function getRejectedResumes(userId) {
    try {
        await connectDB();
        const results = await ResumeInstance.find({
            userId,
            status: "rejected"
        })
            .populate("resumeId", "originalName fileUrl")
            .sort({ updatedAt: -1 })
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(results)) };
    } catch (error) {
        console.error("User: Error fetching rejected resumes ->", error);
        return { success: false, error: error.message };
    }
}

/**
 * Permanently skips the current resume for this user and auto-assigns the next
 */
export async function skipResume(resumeId, userId) {
    try {
        await connectDB();

        const user = await User.findById(userId).select("endDate role stats").lean();
        if (!user) return { success: false, error: "User profile node not located." };

        const now = new Date();
        const expiry = new Date(user.endDate);
        expiry.setHours(23, 59, 59, 999);

        if (now > expiry && user.role !== "admin") {
            return {
                success: false,
                error: "Project Timeline Completed. New assignments are locked.",
            };
        }

        await ResumeInstance.findOneAndUpdate(
            { resumeId, userId },
            {
                $set: {
                    status: "skipped",
                    formData: {},
                    isTouched: false,
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        const workedResumes = await ResumeInstance.find({ userId }).distinct("resumeId");

        const nextResume = await Resume.findOne({
            isAvailable: true,
            _id: { $nin: workedResumes },
        });

        if (!nextResume) {
            const statsUpdate = {};
            if (user.stats?.inProgressCount > 0) {
                statsUpdate["stats.inProgressCount"] = -1;
            }
            if (Object.keys(statsUpdate).length > 0) {
                await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
            }
            revalidatePath("/user");
            return {
                success: true,
                resumeId: null,
                message: "Resume skipped. No more resumes available right now.",
            };
        }

        await Promise.all([
            ResumeInstance.create({
                userId,
                resumeId: nextResume._id,
                status: "in-progress",
                formData: {},
            }),
            Resume.findByIdAndUpdate(nextResume._id, {
                $inc: { totalHits: 1 },
            }),
            User.findByIdAndUpdate(userId, {
                $set: { "stats.inProgressCount": 1 }
            }),
        ]);

        revalidatePath("/user");
        return { success: true, resumeId: nextResume._id.toString() };

    } catch (error) {
        console.error("Skip Resume Error:", error);

        if (error.code === 11000) {
            const existing = await ResumeInstance.findOne({
                userId,
                status: "in-progress",
            }).lean();
            if (existing) {
                return { success: true, resumeId: existing.resumeId.toString() };
            }
        }
        return { success: false, error: "Internal database task swap failure." };
    }
}