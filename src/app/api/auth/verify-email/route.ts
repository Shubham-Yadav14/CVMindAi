import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { sendAuthEmail } from "@/app/lib/email";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = request.nextUrl.searchParams.get("email");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured" },
      { status: 500 },
    );
  }

  // Missing parameters
  if (!token || !email) {
    return NextResponse.redirect(`${appUrl}/login?error=verification_failed`);
  }

  try {
    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();

    const hashedToken = createHash("sha256").update(token).digest("hex");

    // Find user using BOTH email and token
    const user = await User.findOne({
      email: normalizedEmail,
      emailVerificationToken: hashedToken,
    }).select("+emailVerificationToken +emailVerificationExpires");

    // Token doesn't exist
    if (!user) {
      return NextResponse.redirect(`${appUrl}/login?error=invalid_verification_token`);
    }

    // Already verified
    if (user.emailVerified) {
      return NextResponse.redirect(`${appUrl}/login?verified=true`);
    }

    // Token expired
    if (!user.emailVerificationExpires || user.emailVerificationExpires.getTime() < Date.now()) {
      // Generate a new verification token
      const newVerificationToken = randomBytes(32).toString("hex");

      const hashedVerificationToken = createHash("sha256")
        .update(newVerificationToken)
        .digest("hex");

      // New expiry: 24 hours from now
      const newVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update user with the new token
      user.emailVerificationToken = hashedVerificationToken;
      user.emailVerificationExpires = newVerificationExpires;

      await user.save();

      // Create new verification URL
      const verificationUrl =
        `${appUrl}/verify_email` +
        `?email=${encodeURIComponent(normalizedEmail)}` +
        `&token=${encodeURIComponent(newVerificationToken)}`;

      // Send new verification email
      await sendAuthEmail(
        normalizedEmail,
        "New CVMindAi email verification link",
        `Hi ${user.name}!

Your previous email verification link has expired.

Please verify your email using the new link below:

${verificationUrl}

This new verification link expires in 24 hours.

If you did not create this account, you can safely ignore this email.`,
      );

      // Redirect to login
      return NextResponse.redirect(
        `${appUrl}/login?error=verification_expired&email=${encodeURIComponent(
          normalizedEmail,
        )}&resent=true`,
      );
    }

    // -----------------------------
    // Verify user
    // -----------------------------

    user.emailVerified = true;

    // Remove token so it cannot be reused
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return NextResponse.redirect(`${appUrl}/login?verified=true`);
  } catch (error) {
    console.error("Verify email error:", error);

    return NextResponse.redirect(`${appUrl}/login?error=verification_failed`);
  }
}
