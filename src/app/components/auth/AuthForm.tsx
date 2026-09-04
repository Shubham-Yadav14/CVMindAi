"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, LoaderCircle, Moon, Sun } from "lucide-react";
import useModeStore from "@/app/lib/useModeStore";
import { useSnackbar } from "@/app/components/ui/SnackbarProvider";
import Image from "next/image";
import Favicon from "../../favicon.ico"

type AuthMode = "login" | "signup";

type AuthFormProps = {
  initialMode?: AuthMode;
  oauthError?: string | null;
  verificationMessage?: string | null;
  onModeChange?: (mode: AuthMode) => void;
};

const ERROR_MESSAGES: Record<string, string> = {
  google_auth_cancelled: "Google sign-in was cancelled.",
  google_auth_failed: "Google sign-in failed. Please try again.",
  invalid_state: "Invalid OAuth state. Please try again.",
  email_not_verified: "Your Google email is not verified.",
  google_not_configured: "Google sign-in is not configured yet.",
  verification_failed: "That verification link is invalid or expired.",
};

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />

      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />

      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />

      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthForm({
  initialMode = "login",
  oauthError,
  verificationMessage,
  onModeChange,
}: AuthFormProps) {
  const router = useRouter();
  const { lightMode, toggleMode } = useModeStore();
  const { showSnackbar } = useSnackbar();

  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const isSignup = mode === "signup";

  useEffect(() => {
    if (oauthError) {
      showSnackbar(ERROR_MESSAGES[oauthError] ?? oauthError, "error");
    }
    if (verificationMessage) {
      showSnackbar(verificationMessage, "success");
    }
  }, [oauthError, showSnackbar, verificationMessage]);

  const switchMode = (nextMode: AuthMode): void => {
    if (nextMode === mode) return;

    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  const inputClass = `w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-sm outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/40 ${
    lightMode
      ? "border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-500"
      : "border-slate-700 bg-slate-900/70 text-slate-100 placeholder:text-slate-400"
  }`;

  const passwordWrapperClass = `flex items-center rounded-xl border px-3.5 py-1 text-sm shadow-sm outline-none ring-0 transition focus-within:ring-2 focus-within:ring-indigo-400/40 ${
    lightMode
      ? "border-slate-200 bg-white/80 text-slate-900"
      : "border-slate-700 bg-slate-900/70 text-slate-100"
  }`;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";

      const body = isSignup
        ? {
            name,
            email,
            password,
          }
        : {
            email,
            password,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data: { error?: string; message?: string } = await res.json();

      if (!res.ok) {
        showSnackbar(data.error ?? "Something went wrong", "error");
        return;
      }

      if (isSignup) {
        showSnackbar(data.message ?? "Account created. Check your email to verify your account.", "success");
        setPassword("");
      } else {
        showSnackbar("Signed in successfully.", "success");
        router.push("/");
        router.refresh();
      }
    } catch {
      showSnackbar("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = (): void => {
    window.location.href = "/api/auth/google";
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data: { error?: string; message?: string } = await response.json();
      if (!response.ok) showSnackbar(data.error ?? "Unable to request password reset", "error");
      else showSnackbar(data.message ?? "Check your email for password reset instructions.", "success");
    } catch {
      showSnackbar("Network error. Please try again.", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className={`relative flex min-h-screen w-full items-center justify-center px-4 py-8 transition-colors duration-300 ${
        lightMode ? "bg-slate-50 text-slate-900" : "bg-[#101820] text-slate-50"
      }`}
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      {/* Main Card */}
      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-sm transition-colors duration-300 sm:p-8 ${
          lightMode ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950"
        }`}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                lightMode ? "bg-teal-100 text-teal-700" : "bg-teal-950 text-teal-300"
              }`}
            >
              <Image src={Favicon} alt="CVMindAi Logo"/>
            </div>

            <span className="text-base font-semibold">CVMindAi</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleMode}
            type="button"
            aria-label="Toggle theme"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
              lightMode
                ? "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
                : "border-slate-700 bg-slate-800/70 text-yellow-200 hover:bg-slate-800"
            }`}
          >
            {lightMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        {/* Login / Signup Tabs */}
        <div
          className={`relative mb-6 flex rounded-xl p-1 ${
            lightMode ? "bg-slate-100" : "bg-slate-900"
          }`}
        >
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-all duration-300 ease-out ${
              isSignup ? "left-[calc(50%+2px)]" : "left-1"
            }`}
            aria-hidden="true"
          />

          {(["login", "signup"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchMode(tab)}
              className={`relative z-10 flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-300 ${
                mode === tab
                  ? lightMode
                    ? "bg-slate-400 text-slate-900"
                    : "bg-slate-700 text-white"
                  : lightMode
                    ? "text-slate-500 hover:text-slate-700"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Auth Content */}
        <div className="relative min-h-105 overflow-hidden">
          <div key={mode} className="auth-view-enter">
            {/* Title */}
            <div className="mb-5">
              <h1 className="text-xl font-semibold sm:text-2xl">
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>

              <p className={`mt-1 text-sm ${lightMode ? "text-slate-600" : "text-slate-300"}`}>
                {isSignup
                  ? "Start building professional resumes in minutes."
                  : "Sign in to continue to your dashboard."}
              </p>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={`flex w-full items-center justify-center gap-3 rounded-xl border py-2.5 text-sm font-medium transition hover:-translate-y-px ${
                lightMode
                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              }`}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className={`h-px flex-1 ${lightMode ? "bg-slate-200" : "bg-slate-700"}`} />

              <span
                className={`text-xs uppercase tracking-wider ${
                  lightMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                or
              </span>

              <div className={`h-px flex-1 ${lightMode ? "bg-slate-200" : "bg-slate-700"}`} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* Name - Signup only */}
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isSignup ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="name"
                      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Full name
                    </label>

                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignup}
                      autoComplete="name"
                      tabIndex={isSignup ? 0 : -1}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Password
                </label>

                <div className={passwordWrapperClass}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignup ? "Min. 6 characters" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isSignup ? 6 : undefined}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className={`flex-1 bg-transparent text-sm outline-none ${
                      lightMode ? "placeholder:text-slate-500" : "placeholder:text-slate-400"
                    }`}
                  />

                  {/* Show / Hide Password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={`ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                      lightMode
                        ? "text-slate-600 hover:bg-slate-100"
                        : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`mt-2 w-full rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-sky-500 text-sm font-semibold text-white transition hover:-translate-y-px cursor-pointer active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                  loading ? "py-2" : "py-2.5"
                }`}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <LoaderCircle className="animate-spin" size={20} />

                    {isSignup ? "Creating account..." : "Signing in..."}
                  </span>
                ) : isSignup ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
              {!isSignup && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(true);
                  }}
                  className="mx-auto block text-xs font-semibold text-indigo-500 hover:text-indigo-600"
                >
                  Forgot password?
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
      {forgotOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/40 px-4">
          <form
            onSubmit={handleForgotPassword}
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-900"}`}
          >
            <h2 className="text-xl font-semibold">Forgot password?</h2>
            <p className={`mt-1 text-sm ${lightMode ? "text-slate-500" : "text-slate-400"}`}>
              Enter your email and we will request a password reset.
            </p>
            <input
              autoFocus
              required
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${inputClass} mt-5`}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className={`rounded-xl px-4 py-2 text-sm ${lightMode ? "text-slate-600 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-800"}`}
              >
                Cancel
              </button>
              <button
                disabled={forgotLoading}
                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
              >
                {forgotLoading ? "Requesting..." : "Request reset"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export { ERROR_MESSAGES };
