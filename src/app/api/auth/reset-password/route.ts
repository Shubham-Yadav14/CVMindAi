import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/app/lib/auth";
import connectDB from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    if (typeof token !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Reset token and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({
      resetPasswordToken: createHash("sha256").update(token).digest("hex"),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) return NextResponse.json({ error: "This reset link is invalid or expired" }, { status: 400 });

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
}