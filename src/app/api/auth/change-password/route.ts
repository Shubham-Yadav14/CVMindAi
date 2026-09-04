import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(currentUser._id).select("+password");
    if (!user?.password || !(await verifyPassword(currentPassword, user.password))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Unable to change password" }, { status: 500 });
  }
}