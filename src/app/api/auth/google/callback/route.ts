import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/app/lib/mongodb";
import User from "@/app/models/User";
import {
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from "@/app/lib/google";
import { signToken, setAuthCookie } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured" },
      { status: 500 },
    );
  }

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=google_auth_cancelled`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/login?error=google_auth_failed`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code, appUrl);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.verified_email) {
      return NextResponse.redirect(`${appUrl}/login?error=email_not_verified`);
    }

    await connectDB();

    let user = await User.findOne({
      $or: [{ googleId: googleUser.id }, { email: googleUser.email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleUser.id;
        user.image = user.image ?? googleUser.picture;
      }
      user.emailVerified = true;
      await user.save();
    } else {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.id,
        image: googleUser.picture,
        emailVerified: true,
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
    });

    await setAuthCookie(token);

    return NextResponse.redirect(`${appUrl}/`);
  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=google_auth_failed`);
  }
}
