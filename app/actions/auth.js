"use server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import {
  generateLoginId,
  generateRandomPassword,
  validateEmail,
  validatePhone
} from "@/lib/utils";

import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation"; // Redirect ke liye

// register function bhi yahan hi add kar dete hain
export async function registerUser(formData) {
  try {
    // 1. Database Connection shuru karo
    await connectDB();

    // 2. Form Data extract karo
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const phone = formData.get('phone')?.trim();

    // 3. Strict Validations (Using our Utils)
    if (!name || name.length < 2) {
      return { success: false, error: "Please enter a valid name (min 2 chars)." };
    }
    if (!validateEmail(email)) {
      return { success: false, error: "Please provide a valid email address." };
    }
    if (!validatePhone(phone)) {
      return { success: false, error: "Phone number must be exactly 10 digits." };
    }

    // 4. Duplicate Check (Security Layer)
    const existingUser = await User.findOne({
      $or: [{ email: email }, { phone: phone }]
    });

    if (existingUser) {
      return {
        success: false,
        error: "A user with this email or phone already exists."
      };
    }

    // 5. Credentials Generation (The Logic)
    const loginId = generateLoginId(); // DTS_17042026xxxxxx
    const rawPassword = generateRandomPassword(); // ABCD12ef@

    // REMOVED: const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 6. DB Entry (Now saving rawPassword directly)
    await User.create({
      name,
      email,
      phone,
      loginId,
      password: rawPassword // <--- Saving the plain text password here
    });

    // 7. Email Configuration (Nodemailer)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 8. Send Professional Email
    await transporter.sendMail({
      from: `"DATASORT Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to DATASORT - Your Account Credentials",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: -1px;">DATASORT</h1>
          </div>
          <div style="padding: 30px; color: #1e293b;">
            <h2 style="margin-top: 0; color: #2563eb;">Hello ${name},</h2>
            <p>Your workspace account has been created successfully. You can now login using the credentials below:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0;">
              <p style="margin: 5px 0;"><strong>Login ID:</strong> <span style="color: #2563eb;">${loginId}</span></p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <span style="color: #2563eb;">${rawPassword}</span></p>
            </div>

            <p style="font-size: 14px; line-height: 1.6;">
              <strong>Important:</strong> Your account is currently under review. Please complete your KYC and profile setup immediately to ensure uninterrupted access.
            </p>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            This is an automated message. Please do not reply to this email.
          </div>
        </div>
      `
    });

    return {
      success: true,
      message: "User registered successfully. Credentials sent to email."
    };

  } catch (error) {
    console.error("Critical Registration Error:", error);
    return {
      success: false,
      error: "An internal server error occurred. Please try again later."
    };
  }
}


// login   function bhi yahan hi add kar dete hain
export async function loginUser(formData) {
  try {
    await connectDB();
    const loginId = formData.get('loginId')?.trim();
    const password = formData.get('password');

    if (!loginId || !password) {
      return { success: false, message: "Please provide both ID and Password" };
    }

    // 1. Find user by loginId
    const user = await User.findOne({ loginId });

    // 2. Agar user nahi mila
    if (!user) {
      return { success: false, message: "Invalid Login ID or Password" };
    }

    // 3. Simple String Comparison (No Bcrypt)
    // Checking the plain text password from DB against the user input
    const isMatch = password === user.password;

    if (!isMatch) {
      return { success: false, message: "Invalid Login ID or Password" };
    }

    // 4. Cookies setup
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 Days
    };

    cookieStore.set('role', user.role, cookieOptions);
    cookieStore.set('userId', user._id.toString(), cookieOptions);
    cookieStore.set('userName', user.name, cookieOptions);

    return { success: true, role: user.role };

  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}


//logout function bhi yahan hi add kar dete hain 
export async function logoutUser() {
  const cookieStore = await cookies();

  // 1. Saari cookies ko delete karo
  // Server-side deletion httpOnly cookies par bhi kaam karti hai
  cookieStore.delete("role");
  cookieStore.delete("userId");
  cookieStore.delete("userName");

  // 2. Redirect to login page
  // 'redirect' function Next.js mein internally error throw karke handle hota hai
  // Isliye iske baad koi aur code execute nahi hoga.
  redirect("/login");
}