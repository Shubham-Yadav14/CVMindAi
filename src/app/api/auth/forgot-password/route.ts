import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import { sendAuthEmail } from "@/app/lib/email";
import User from "@/app/models/User";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      const token = randomBytes(32).toString("hex");
      user.resetPasswordToken = createHash("sha256").update(token).digest("hex");
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
      await sendAuthEmail(
        user.email,
        "Reset your CVMindAi password",
        `Open this link to choose a new password:\n\n${appUrl}/reset-password?token=${token}\n\nThis link expires in 15 minutes.`,
      );
    }

    return NextResponse.json({
      message: "If an account exists for that email, password reset instructions have been requested.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Unable to request password reset" }, { status: 500 });
  }
}