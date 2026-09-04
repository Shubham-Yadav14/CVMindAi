"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import AuthForm, { ERROR_MESSAGES } from "@/app/components/auth/AuthForm";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const oauthError = searchParams.get("error");
  const errorMessage = oauthError ? ERROR_MESSAGES[oauthError] : null;
  const verifiedMessage = searchParams.get("verified") === "true"
    ? "Email verified successfully. You can now sign in."
    : null;
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace("/");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  const handleModeChange = (mode: "login" | "signup") => {
    const url = mode === "signup" ? "/login?mode=signup" : "/login";
    router.replace(url, { scroll: false });
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <AuthForm
      key={initialMode}
      initialMode={initialMode}
      oauthError={errorMessage}
      verificationMessage={verifiedMessage}
      onModeChange={handleModeChange}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
