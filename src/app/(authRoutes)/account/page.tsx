"use client";

import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import useModeStore from "@/app/lib/useModeStore";
import { useSnackbar } from "@/app/components/ui/SnackbarProvider";

export default function AccountPage() {
  const { lightMode } = useModeStore();
  const { showSnackbar } = useSnackbar();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showSnackbar("New passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) showSnackbar(data.error ?? "Unable to change password", "error");
      else {
        showSnackbar(data.message ?? "Password changed successfully.", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      showSnackbar("Network error. Please try again.", "error");
    }
    setLoading(false);
  };

  return (
    <main className={`app-surface min-h-full px-5 py-8 sm:px-8 sm:py-10`}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-600">Account</p><h1 className="mt-2 text-3xl font-semibold">Security settings</h1><p className={`mt-2 text-sm ${lightMode ? "text-slate-500" : "text-slate-400"}`}>Update the password you use to sign in.</p></div>
        <form onSubmit={changePassword} className={`max-w-xl rounded-2xl border p-6 shadow-sm ${lightMode ? "border-slate-200 bg-white" : "border-slate-800 bg-[#17232d]"}`}>
          <div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700"><KeyRound size={19} /></div><div><h2 className="font-semibold">Change password</h2><p className={`text-xs ${lightMode ? "text-slate-500" : "text-slate-400"}`}>You will need your current password.</p></div></div>
          <div className="space-y-4">
            <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 ${lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-950"}`} />
            <input type="password" required minLength={6} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 ${lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-950"}`} />
            <input type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 ${lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-950"}`} />
          </div>
          <button disabled={loading} className="mt-6 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{loading ? "Updating..." : "Change password"}</button>
        </form>
      </div>
    </main>
  );
}
