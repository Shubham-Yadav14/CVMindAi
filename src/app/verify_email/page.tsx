"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { FileText, LoaderCircle, Moon, Sun, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import useModeStore from "@/app/lib/useModeStore";

function VerificationContent() {
  const searchParams = useSearchParams();
  const { lightMode, toggleMode } = useModeStore();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) return;

    const verificationUrl = new URL("/api/auth/verify-email", window.location.origin);
    verificationUrl.searchParams.set("token", token);
    verificationUrl.searchParams.set("email", email);
    window.location.replace(verificationUrl.toString());
  }, [email, token]);

  const hasVerificationDetails = Boolean(token && email);

  return (
    <main
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-8 transition-colors duration-300 ${
        lightMode ? "bg-slate-50 text-slate-900" : "bg-[#101820] text-slate-50"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-40 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <section
        className={`relative z-10 w-full max-w-md rounded-3xl border p-6 text-center shadow-xl backdrop-blur-sm sm:p-8 ${
          lightMode ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-left">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                lightMode ? "bg-teal-100 text-teal-700" : "bg-teal-950 text-teal-300"
              }`}
            >
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">CVMindAi</span>
          </div>

          <button
            onClick={toggleMode}
            type="button"
            aria-label="Toggle theme"
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              lightMode
                ? "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                : "border-slate-700 bg-slate-800/70 text-yellow-200 hover:bg-slate-800"
            }`}
          >
            {lightMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        {hasVerificationDetails ? (
          <>
            <LoaderCircle
              className="mx-auto mb-5 h-12 w-12 animate-spin text-indigo-500"
              aria-hidden="true"
            />
            <h1 className="text-xl font-semibold sm:text-2xl">Verifying your email</h1>
            <p className={`mt-2 text-sm ${lightMode ? "text-slate-600" : "text-slate-300"}`}>
              Please wait while we confirm your email address.
            </p>
          </>
        ) : (
          <>
            <TriangleAlert className="mx-auto mb-5 h-12 w-12 text-amber-500" aria-hidden="true" />
            <h1 className="text-xl font-semibold sm:text-2xl">Verification link is incomplete</h1>
            <p className={`mt-2 text-sm ${lightMode ? "text-slate-600" : "text-slate-300"}`}>
              Open the complete verification link from your email, or return to sign in.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              Return to sign in
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}