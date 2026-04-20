"use server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function getLatestUserData(userId) {
  try {
    await connectDB();
    const user = await User.findById(userId).select("-password").lean();
    if (!user) return { success: false, error: "User not found" };
    
    // MongoDB _id ko string mein convert karne ke liye
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}