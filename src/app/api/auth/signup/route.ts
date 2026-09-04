import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { createHash, randomBytes } from "crypto";
import { hashPassword } from "@/app/lib/auth";
import { sendAuthEmail } from "@/app/lib/email";

const VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      // Already verified
      if (existingUser.emailVerified) {
        return NextResponse.json(
          {
            error: "An account with this email already exists, try logging in",
          },
          { status: 409 },
        );
      }

      // Existing account but NOT verified.
      // Generate a completely new verification token.
      const verificationToken = randomBytes(32).toString("hex");

      const hashedVerificationToken = createHash("sha256").update(verificationToken).digest("hex");

      const verificationExpires = new Date(Date.now() + VERIFICATION_EXPIRY);

      const hashedPassword = await hashPassword(password);

      await User.updateOne(
        { email: normalizedEmail },
        {
          $set: {
            name: name.trim(),
            password: hashedPassword,
            emailVerified: false,
            emailVerificationToken: hashedVerificationToken,
            emailVerificationExpires: verificationExpires,
          },
        },
      );

      // -----------------------------
      // Send new verification email
      // -----------------------------

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured");

      const verificationUrl =
        `${appUrl}/verify_email` +
        `?email=${encodeURIComponent(normalizedEmail)}` +
        `&token=${encodeURIComponent(verificationToken)}`;

      sendAuthEmail(
        normalizedEmail,
        "Verify your CVMindAi email",
        `Welcome ${name.trim()}!

Please verify your email address by opening the link below:

${verificationUrl}

This verification link expires in 24 hours.

If you did not create this account, you can safely ignore this email.`,
      );

      return NextResponse.json(
        {
          message: "Your account is not verified. A new verification email has been sent.",
        },
        { status: 200 },
      );
    }

    // -----------------------------
    // Create new user
    // -----------------------------

    const hashedPassword = await hashPassword(password);

    const verificationToken = randomBytes(32).toString("hex");

    const hashedVerificationToken = createHash("sha256").update(verificationToken).digest("hex");

    const verificationExpires = new Date(Date.now() + VERIFICATION_EXPIRY);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // -----------------------------
    // Send verification email
    // -----------------------------

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured");

    const verificationUrl =
      `${appUrl}/verify_email` +
      `?email=${encodeURIComponent(normalizedEmail)}` +
      `&token=${encodeURIComponent(verificationToken)}`;

    sendAuthEmail(
      normalizedEmail,
      "Verify your CVMindAi email",
      `Welcome ${name.trim()}!

Please verify your email address by opening the link below:

${verificationUrl}

This verification link expires in 24 hours.

If you did not create this account, you can safely ignore this email.`,
    );

    return NextResponse.json(
      {
        message: "Account created. Check your email to verify your account.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
