"use server";
import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import User from "@/models/User";
import ResumeInstance from "@/models/ResumeInstance"; // Tera instance model
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

// User ke liye resumes fetch karne ka server action
export async function getResumesForUser(page = 1, limit = 8, userId) {
    try {
        await connectDB();
        
        // --- 1. FETCH USER DATA FOR THE DATE GUARD ---
        const user = await User.findById(userId).select('endDate role').lean();
        if (!user) return { success: false, error: "User not found" };

        const now = new Date();
        const expiry = new Date(user.endDate);
        expiry.setHours(23, 59, 59, 999);
        const isExpired = now > expiry && user.role !== "admin";

        const skip = (page - 1) * limit;

        // 2. Fetch master resumes
        const resumes = await Resume.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Resume.countDocuments({});

        // 3. Fetch user instances
        const userInstances = await ResumeInstance.find({ userId })
            .select('resumeId status')
            .lean();

        // 4. Map resumes with "Smart Expiry" logic
        const mappedData = resumes.map(res => {
            const instance = userInstances.find(inst => inst.resumeId.toString() === res._id.toString());
            
            let status = instance ? instance.status : 'available';

            // --- THE GUARD ---
            // If the plan is expired and they haven't worked on this resume yet,
            // we mark it as 'locked' instead of 'available'.
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
// hits ko incremnet krne ke liye



// @/app/actions/userWork.js

export async function autoAssignAndGetId(userId) {
    try {
        await connectDB();

        // --- 0. THE SECURITY GUARD (BLOCK NEW ASSIGNMENTS) ---
        const user = await User.findById(userId).select('endDate role').lean();
        if (!user) return { success: false, error: "User profile not found." };

        const now = new Date();
        const expiry = new Date(user.endDate);
        expiry.setHours(23, 59, 59, 999);

        // If time is up, don't let them assign anything new
        if (now > expiry && user.role !== "admin") {
            return { 
                success: false, 
                error: "Project Timeline Completed. New assignments are locked." 
            };
        }

        // 1. RECOVERY CHECK (Existing logic - stays same)
        const existingTask = await ResumeInstance.findOne({
            userId,
            status: "in-progress"
        });

        if (existingTask) {
            return { success: true, resumeId: existingTask.resumeId.toString() };
        }

        // 2. ASSIGN NEW
        const workedResumes = await ResumeInstance.find({ userId }).distinct('resumeId');

        const nextResume = await Resume.findOne({
            isAvailable: true,
            _id: { $nin: workedResumes }
        });

        if (!nextResume) {
            return { success: false, error: "All resumes completed!" };
        }

        // 3. CREATE NEW INSTANCE & UPDATE USER STATS
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

export async function incrementResumeHits(resumeId) {
    try {
        await connectDB();
        await Resume.findByIdAndUpdate(resumeId, {
            $inc: { totalHits: 1 } // Har baar click par 1 badh jayega
        });
        return { success: true };
    } catch (error) {
        console.error("Error incrementing hits:", error);
        return { success: false };
    }
}
// Resume progress ko save karne ka server action (Auto-save ke liye)
export async function saveResumeProgress(resumeId, userId, data) {
    try {
        await connectDB();

        // 1. Fetch current status and user stats simultaneously
        const [existingDoc, userDoc] = await Promise.all([
            ResumeInstance.findOne({ resumeId, userId }).lean(),
            User.findById(userId).select("stats").lean()
        ]);

        const oldStatus = existingDoc ? existingDoc.status : 'default';
        const currentStats = userDoc?.stats || {};

        // 2. Data update/save
        await ResumeInstance.findOneAndUpdate(
            { resumeId, userId },
            {
                $set: {
                    formData: data,
                    status: 'in-progress',
                    isTouched: true
                }
            },
            { upsert: true }
        );

        // 3. 🔥 DYNAMIC STATS LOGIC (Zero-Floor Protected)
        const statsUpdate = {};

        // Only update stats if we are CHANGING to 'in-progress'
        if (oldStatus !== 'in-progress') {

            // Case A: First time touching the task (New or Default)
            if (oldStatus === 'default' || !existingDoc) {
                statsUpdate["stats.inProgressCount"] = 1;
            }

            // Case B: Moving a Rejected task back to Progress
            else if (oldStatus === 'rejected') {
                statsUpdate["stats.inProgressCount"] = 1;
                // Floor protection: Only minus if > 0
                if (currentStats.rejectedCount > 0) {
                    statsUpdate["stats.rejectedCount"] = -1;
                }
            }

            // Case C: If it was 'submitted' but user is editing again (optional logic)
            else if (oldStatus === 'submitted') {
                statsUpdate["stats.inProgressCount"] = 1;
                if (currentStats.submittedCount > 0) {
                    statsUpdate["stats.submittedCount"] = -1;
                }
            }
        }

        // 4. Atomic Update
        if (Object.keys(statsUpdate).length > 0) {
            await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
        }

        revalidatePath("/user");
        return { success: true };

    } catch (error) {
        console.error("Auto-save error:", error);
        return { success: false };
    }
}

//save option
export async function holdAndSaveResume(resumeId, userId, data) {
    try {
        await connectDB();

        // 1. Fetch current status and user stats simultaneously
        const [existingDoc, userDoc] = await Promise.all([
            ResumeInstance.findOne({ resumeId, userId }).lean(),
            User.findById(userId).select("stats").lean()
        ]);

        const oldStatus = existingDoc ? existingDoc.status : 'default';
        const currentStats = userDoc?.stats || {};

        // 2. Update status to 'saved'
        // This 'saved' status unlocks the "New Assignment" button in your logic
        await ResumeInstance.findOneAndUpdate(
            { resumeId, userId },
            {
                $set: {
                    formData: data,
                    status: 'saved',
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        // 3. 🔥 DYNAMIC STATS LOGIC (Zero-Floor Protected)
        const statsUpdate = {};

        // Only adjust stats if we are MOVING OUT of a counted state
        if (oldStatus !== 'saved') {

            // If it was being worked on, we must decrease inProgress
            if (oldStatus === 'in-progress' || oldStatus === 're-assigned') {
                if (currentStats.inProgressCount > 0) {
                    statsUpdate["stats.inProgressCount"] = -1;
                }
            }

            // If it was a rejected task being moved to 'saved'
            else if (oldStatus === 'rejected') {
                if (currentStats.rejectedCount > 0) {
                    statsUpdate["stats.rejectedCount"] = -1;
                }
            }

            // Note: We don't increment 'saved' count because it's usually 
            // a neutral state that doesn't show in your main dashboard cards.
        }

        // 4. Atomic Update
        if (Object.keys(statsUpdate).length > 0) {
            await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
        }

        revalidatePath("/user");
        return {
            success: true,
            message: "Resume parked in 'Saved' list. You can now take a new assignment."
        };

    } catch (error) {
        console.error("Hold/Save error:", error);
        return { success: false, message: "Failed to move resume." };
    }
}

//reusme
export async function submitResume(resumeId, userId, data) {
    try {
        await connectDB();

        // 1. Get current states
        const [currentDoc, userDoc] = await Promise.all([
            ResumeInstance.findOne({ resumeId, userId }).lean(),
            User.findById(userId).select("stats").lean()
        ]);

        const oldStatus = currentDoc ? currentDoc.status : null;
        const currentStats = userDoc?.stats || {};

        // 2. Update the Resume
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

        // 3. DYNAMIC STATS LOGIC (With Zero-Floor Protection)
        const statsUpdate = {};

        if (oldStatus !== 'submitted') {
            // INCREASE SUBMITTED: 0 -> 1, 1 -> 2, etc.
            statsUpdate["stats.submittedCount"] = 1;

            // DECREASE IN-PROGRESS: Only if > 0
            if ((oldStatus === 'in-progress' || oldStatus === 're-assigned') && (currentStats.inProgressCount > 0)) {
                statsUpdate["stats.inProgressCount"] = -1;
            }

            // DECREASE REJECTED: Only if > 0
            else if (oldStatus === 'rejected' && (currentStats.rejectedCount > 0)) {
                statsUpdate["stats.rejectedCount"] = -1;
            }
        }

        // 4. Update the User Atomicly
        if (Object.keys(statsUpdate).length > 0) {
            await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
        }

        // 5. Fetch Final Data for UI
        const updatedUser = await User.findById(userId).select("stats kycStatus bankDetailsStatus").lean();

        revalidatePath("/user");

        return {
            success: true,
            newData: {
                stats: updatedUser.stats,
                kycStatus: updatedUser.kycStatus,
                bankDetailsStatus: updatedUser.bankDetailsStatus
            }
        };

    } catch (error) {
        console.error("❌ SUBMIT ERROR:", error.message);
        return { success: false, error: error.message };
    }
}



// User ke submitted resumes fetch karne ka server action
export async function getSubmittedResumes(userId) {
    try {
        await connectDB();
        // Hum submitted, pending, approved aur rejected charo status uthayenge
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


// User ke in-progress resumes fetch karne ka server action
export async function getInProgressResumes(userId) {
    try {
        await connectDB();
        const results = await ResumeInstance.find({
            userId,
            status: 'in-progress'
        })
            .populate('resumeId', 'originalName')
            .sort({ updatedAt: -1 }) // Taki jo abhi chhoda wahi sabse upar dikhe
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(results)) };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


// Workspace ke liye - Resume + saved formData dono saath
//// Ek specific resume ke liye details fetch karne ka function
export async function getWorkspaceData(resumeId, userId) {
    try {
        if (!resumeId || resumeId === "undefined") return { success: false, error: "Invalid ID" };

        await connectDB();

        // Fetch User, Resume, and Instance
        const [resume, instance, user] = await Promise.all([
            Resume.findById(resumeId).lean(),
            ResumeInstance.findOne({ resumeId, userId }).lean(),
            User.findById(userId).select('endDate role isActive').lean()
        ]);

        if (!resume || !user) return { success: false, error: "Data not found" };

        // THE GUARD
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

        return {
            success: true,
            data: { ...JSON.parse(JSON.stringify(resume)), formData: instance?.formData || null }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

//reassgined resume layega user ke liye
export async function getReassignedResumes(userId) {
    try {
        await connectDB();

        const results = await ResumeInstance.find({
            userId,
            // Use $in to check for multiple possible statuses
            status: { $in: ["re-assigned", "saved", "review"] }
        })
            .populate("resumeId", "originalName fileUrl")
            .sort({ updatedAt: -1 })
            .lean();
        return {
            success: true,
            data: JSON.parse(JSON.stringify(results))
        };
    } catch (error) {
        console.error("User: Error fetching re-assigned resumes ->", error);
        return { success: false, error: error.message };
    }
}

//rejceted reumes yaha se ajaynge 
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

        return {
            success: true,
            data: JSON.parse(JSON.stringify(results))
        };
    } catch (error) {
        console.error("User: Error fetching rejected resumes ->", error);
        return { success: false, error: error.message };
    }
}


export async function getUserTodayAndTotalWork(userId) {
    try {
        await connectDB();

        // 1. Get the start of Today (00:00:00)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // 2. Count Total Completed (Submitted + Saved) - ALL TIME
        const totalCompleted = await ResumeInstance.countDocuments({
            userId,
            status: { $in: ["submitted", "saved", "approved"] }
        });

        // 3. Count Completed TODAY only
        const todayCompleted = await ResumeInstance.countDocuments({
            userId,
            status: { $in: ["submitted", "saved"] },
            updatedAt: { $gte: startOfToday } // Filter by timestamp
        });

        return {
            success: true,
            counts: {
                total: totalCompleted,
                today: todayCompleted
            }
        };
    } catch (error) {
        console.error("Error fetching work counts:", error);
        return { success: false, counts: { total: 0, today: 0 } };
    }
}