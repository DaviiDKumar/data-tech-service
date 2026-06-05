// app/actions/auth.js
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
import { redirect } from "next/navigation";

export async function registerUser(formData) {
  try {
    await connectDB();

    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const phone = formData.get('phone')?.trim();

    // 1. Strict input validation
    if (!name || name.length < 2) {
      return { success: false, error: "Please enter a valid name (min 2 chars)." };
    }
    if (!validateEmail(email)) {
      return { success: false, error: "Please provide a valid email address." };
    }
    if (!validatePhone(phone)) {
      return { success: false, error: "Phone number must be exactly 10 digits." };
    }

    const normalizedEmail = email.toLowerCase();

    // 2. Prevent duplicate entries
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone }]
    });

    if (existingUser) {
      return {
        success: false,
        error: "A workspace account with this email or phone number is already active."
      };
    }

    const loginId = generateLoginId(); 
    const rawPassword = generateRandomPassword(); 

    // 3. Save User securely to database
    await User.create({
      name,
      email: normalizedEmail,
      phone,
      loginId,
      password: rawPassword 
    });

    // 4. Isolated Email Channel
    // Wrapped in its own try-catch block so email-provider timeouts don't crash database records
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"DATASORT Operations" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: "Welcome to DATASORT - Secure Workspace Credentials",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #000000; color: white; padding: 25px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; letter-spacing: 2px;">DATASORT DATA SERVICES</h1>
            </div>
            <div style="padding: 30px; color: #1e293b;">
              <h2 style="margin-top: 0; color: #000000;">Hello ${name},</h2>
              <p>Your data extraction terminal account has been generated successfully. Use the parameters below to establish access:</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #000000; padding: 15px; margin: 25px 0; font-family: monospace;">
                <p style="margin: 5px 0; font-size: 14px;"><strong>TERMINAL ID:</strong> <span style="color: #2563eb;">${loginId}</span></p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>PASSWORD:</strong> <span style="color: #2563eb;">${rawPassword}</span></p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.datatechservice.in/login" target="_blank" style="background-color: #000000; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 13px; display: inline-block; letter-spacing: 1px; text-transform: uppercase;">
                  Open Secure Login Terminal
                </a>
              </div>

              <p style="text-align: center; margin-top: 10px;">
                <a href="https://www.datatechservice.in" target="_blank" style="color: #64748b; font-size: 11px; text-decoration: underline;">www.datatechservice.in</a>
              </p>

              <p style="font-size: 12px; line-height: 1.6; color: #64748b; border-t: 1px solid #f1f5f9; pt: 20px; margin-top: 25px;">
                <strong>Security Protocol Warning:</strong> Your access node is currently initialized in evaluation status. Complete your profile build-out inside your dashboard to ensure configuration persistence.
              </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-t: 1px solid #e2e8f0;">
              Automated system dispatch message. Do not reply to this endpoint directly.
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error("⚠️ Background SMTP Dispatch Error:", emailError);
    }

    return {
      success: true,
      message: "User account generated. Access credentials dispatched to mailbox."
    };

  } catch (error) {
    console.error("Critical Registration Error:", error);
    return {
      success: false,
      error: "An internal cloud storage fault dropped connection. Please retry later."
    };
  }
}

export async function loginUser(formData) {
  try {
    await connectDB();
    const loginId = formData.get('loginId')?.trim();
    const password = formData.get('password');

    if (!loginId || !password) {
      return { success: false, message: "Please provide both ID and Password" };
    }

    // Case-insensitive clean match using regex boundaries to safely handle user input case changes
    const user = await User.findOne({ 
      loginId: { $regex: `^${loginId}$`, $options: "i" } 
    });

    if (!user || password !== user.password) {
      return { success: false, message: "Invalid Terminal ID or password mapping parameters." };
    }

    if (user.role === "user" && !user.isActive) {
      return { 
        success: false, 
        message: "Your workstation instance is currently deactivated. Contact administration." 
      };
    }

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 Days persistent session loop
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

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("role");
  cookieStore.delete("userId");
  cookieStore.delete("userName");
  redirect("/login");
}