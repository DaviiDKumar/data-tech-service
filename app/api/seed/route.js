// import connectDB from "@/lib/db";
// import User from "@/models/User";
// import bcrypt from "bcryptjs";
// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     await connectDB();

//     const adminEmail = "admin@datasort.com"; 
//     const plainPassword = "ADMIN_PASS_123"; // Jo password tumhe rakhna hai

//     // 1. Check if admin exists
//     const existingAdmin = await User.findOne({ email: adminEmail });
    
//     const hashedPassword = await bcrypt.hash(plainPassword, 10);

//     if (existingAdmin) {
//       existingAdmin.password = hashedPassword;
//       existingAdmin.role = "admin"; // Force role to admin
//       await existingAdmin.save();
//       return NextResponse.json({ message: "Admin Password Updated!" });
//     }

//     // 2. Create New Admin
//     await User.create({
//       name: "Super Admin",
//       email: adminEmail,
//       phone: "0000000000",
//       loginId: "DTS_ADMIN_01", 
//       password: hashedPassword,
//       role: "admin",
//       kycStatus: "verified"
//     });

//     return NextResponse.json({ message: "Admin Created Successfully! ID: DTS_ADMIN_01" });

//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }