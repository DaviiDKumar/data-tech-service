// @/app/actions/userWork.js or your active user actions file
"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import ResumeInstance from "@/models/ResumeInstance"; // Ensure this model is imported here!
import { revalidatePath } from "next/cache";

export async function getLatestUserData(userId) {
  try {
    await connectDB();
    
    // 1. Fetch persistent database metrics structure profile safely
    const user = await User.findById(userId).select("-password").lean();
    if (!user) return { success: false, error: "User profile workstation not located." };
    
    // 2. Calculate timezone-aware UTC boundary matching MongoDB date strings
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Explicitly targets local midnight translated to UTC execution structures
    const startOfToday = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    // Hard offset shift alignment balancing local server space (e.g., IST (-5.5h / -330m))
    startOfToday.setMinutes(startOfToday.getMinutes() - 330);

    // 3. Count matching document entries logged inside the 24h local window frame
    const todayCount = await ResumeInstance.countDocuments({
      userId: user._id,
      status: { $in: ["submitted", "saved", "approved"] },
      updatedAt: { $gte: startOfToday }
    });

    // 4. Inject real-time todayCompletedCount into the dynamic stats object node payload
    const userProfilePayload = {
      ...user,
      id: user._id.toString(),
      stats: {
        ...(user.stats || {}),
        todayCompletedCount: todayCount // ✅ LOCKS PERSISTENCE SAFE ACROSS PAGE REFRESHES
      }
    };

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(userProfilePayload)) 
    };

  } catch (error) {
    console.error("❌ Hydration Sync Error:", error.message);
    return { success: false, error: "Profile state synchronization failed." };
  }
}