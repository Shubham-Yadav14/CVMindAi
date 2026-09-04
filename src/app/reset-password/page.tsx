"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Moon, Sun } from "lucide-react";
import useModeStore from "../lib/useModeStore";
import { useSnackbar } from "@/app/components/ui/SnackbarProvider";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lightMode, toggleMode } = useModeStore();
  const { showSnackbar } = useSnackbar();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: searchParams.get("token"), newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) showSnackbar(data.error ?? "Unable to reset password", "error");
      else {
        showSnackbar(data.message ?? "Password reset successfully.", "success");
        setTimeout(() => router.push("/login"), 1200);
      }
    } catch {
      showSnackbar("Network error. Please try again.", "error");
    }
    setLoading(false);
  };

  return (
    <main className={`flex min-h-screen items-center justify-center px-4 transition-colors ${lightMode ? "bg-slate-50 text-slate-900" : "bg-[#101820] text-slate-50"}`}>
      <form onSubmit={submit} className={`relative w-full max-w-md space-y-5 rounded-2xl border p-8 shadow-xl ${lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-[#17232d]"}`}>
        <button type="button" onClick={toggleMode} aria-label="Toggle theme" className="absolute right-5 top-5 text-slate-500 hover:text-teal-600">{lightMode ? <Moon size={17} /> : <Sun size={17} />}</button>
        <div><h1 className="text-2xl font-semibold">Reset password</h1><p className="mt-1 text-sm text-slate-500">Choose a new password for your account.</p></div>
        <input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className={`w-full rounded-xl border px-3.5 py-2.5 outline-none focus:border-teal-500 ${lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-900"}`} />
        <button disabled={loading} className="w-full rounded-xl bg-teal-700 py-2.5 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50">{loading ? "Resetting..." : "Reset password"}</button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><LoaderCircle className="animate-spin text-teal-600" /></div>}><ResetPasswordForm /></Suspense>;
}