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
        const skip = (page - 1) * limit;

        // 1. Saare master resumes fetch karo
        const resumes = await Resume.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Resume.countDocuments({});

        // 2. Is user ke saare instances fetch karo taaki status check kar sakein
        const userInstances = await ResumeInstance.find({ userId })
            .select('resumeId status')
            .lean();

        // 3. Resumes ko map karo aur status add karo
        const mappedData = resumes.map(res => {
            const instance = userInstances.find(inst => inst.resumeId.toString() === res._id.toString());
            return {
                ...res,
                workStatus: instance ? instance.status : 'available', // Agar instance hai toh uska status, nahi toh 'available'
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

        // 1. Pehle check karo ki kya ye record pehle se exists karta hai aur uska status kya hai
        const existingDoc = await ResumeInstance.findOne({ resumeId, userId });

        // 2. Data update/save karo
        await ResumeInstance.findOneAndUpdate(
            { resumeId, userId },
            {
                $set: {
                    formData: data,
                    status: 'in-progress'
                }
            },
            { upsert: true }
        );

        // 3. 🔥 STATS LOGIC: Sirf tabhi increment karo jab:
        // a) Record naya ho (upsert hua ho)
        // b) Ya uska purana status 'default' ho (matlab pehli baar touch kiya hai)
        if (!existingDoc || existingDoc.status === 'default') {
            await User.findByIdAndUpdate(userId, {
                $inc: { "stats.inProgressCount": 1 }
            });
            console.log("📊 Initial Progress Stats Updated (+1)");
        } else {
            console.log("🔄 Progress Saved (No stats change to avoid duplicate counts)");
        }
        revalidatePath("/user");

        // Frontend ko signal dene ke liye
        return { success: true };

    } catch (error) {
        console.error("Auto-save error:", error);
        return { success: false };
    }
}


//reusme
export async function submitResume(resumeId, userId, data) {
    try {
        await connectDB();

        // 1. Current status check
        const currentDoc = await ResumeInstance.findOne({
            resumeId: new mongoose.Types.ObjectId(resumeId),
            userId: new mongoose.Types.ObjectId(userId)
        });

        const oldStatus = currentDoc ? currentDoc.status : null;

        // 2. Resume Update/Submit
        await ResumeInstance.findOneAndUpdate(
            {
                resumeId: new mongoose.Types.ObjectId(resumeId),
                userId: new mongoose.Types.ObjectId(userId)
            },
            {
                $set: {
                    formData: data,
                    status: 'submitted',
                    submittedAt: new Date(),
                    isTouched: true
                },
                $inc: { revisionCount: 1 }
            },
            { upsert: true, new: true }
        );

        // 3. Stats Logic
        const statsUpdate = {};
        if (oldStatus && oldStatus !== 'submitted') {
            if (oldStatus === 'in-progress' || oldStatus === 're-assigned') {
                statsUpdate["stats.inProgressCount"] = -1;
            } else if (oldStatus === 'rejected') {
                statsUpdate["stats.rejectedCount"] = -1;
            }
            statsUpdate["stats.submittedCount"] = 1;
        } else if (!oldStatus) {
            statsUpdate["stats.submittedCount"] = 1;
        }

        // DB Update
        if (Object.keys(statsUpdate).length > 0) {
            await User.findByIdAndUpdate(userId, { $inc: statsUpdate });
        }

        // ⚡ FETCH UPDATED USER DATA (The optimized way)
        const updatedUser = await User.findById(userId).select("stats kycStatus bankDetailsStatus").lean();

        revalidatePath("/user");

        // ✅ Return success with LATEST DATA
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
        await connectDB();

        const [resume, instance] = await Promise.all([
            Resume.findById(resumeId).lean(),
            ResumeInstance.findOne({ resumeId, userId }).lean()
        ]);

        if (!resume) return { success: false, error: "Resume not found" };

        return {
            success: true,
            data: {
                ...JSON.parse(JSON.stringify(resume)),
                formData: instance?.formData || null  // Saved progress agar hai toh
            }
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
            status: "re-assigned"
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