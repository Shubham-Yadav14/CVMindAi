"use client"
import React, { useState } from "react";
import { User, LogOut, ChevronDown, Moon, Sun, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import useModeStore from "@/app/lib/useModeStore";
import { useSnackbar } from "@/app/components/ui/SnackbarProvider";

interface HeaderProps {
  onMenuClick?: () => void;
}

function Header({ onMenuClick = () => undefined }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const { lightMode, toggleMode } = useModeStore();
  const { showSnackbar } = useSnackbar();

  const userName = "Shubham Yadav";

  // Generate initials from the user's name
  const initials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setIsOpen(false);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      showSnackbar("Signed out successfully.", "success");
      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      showSnackbar(logoutError instanceof Error ? logoutError.message : "Logout failed", "error");
      setLoggingOut(false);
    }
  };

  return (
    <header
      className={`flex min-h-16 w-full shrink-0 items-center justify-between border-b px-3 transition-colors duration-300 sm:px-6 ${lightMode
          ? "border-slate-200 bg-white/90"
          : "border-slate-700 bg-[#14202a]/95"
        }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className={`focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:hidden ${lightMode ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-slate-800"}`}
        >
          <Menu size={21} />
        </button>
        <div className={`hidden truncate text-sm sm:block ${lightMode ? "text-slate-500" : "text-slate-400"}`}>
        Your workspace <span className="mx-1 text-slate-300">/</span> Resume studio
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        
        {/* Right side - User */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`focus-ring flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${lightMode ? "hover:bg-slate-100" : "hover:bg-slate-800"}`}
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {initials}
            </div>

            {/* Name */}
            <span
              className={`hidden text-sm font-medium sm:block ${lightMode ? "text-gray-700" : "text-slate-200"
                }`}
            >
              {userName}
            </span>

            <ChevronDown
              size={16}
              className={`transition-transform ${lightMode ? "text-gray-500" : "text-slate-400"
                } ${isOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              className={`absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border shadow-lg ${lightMode
                  ? "border-gray-200 bg-white"
                  : "border-slate-700 bg-slate-900"
                }`}
            >
              {/* User information */}
              <div
                className={`border-b px-4 py-3 ${lightMode ? "border-gray-100" : "border-slate-700"
                  }`}
              >
                <p
                  className={`text-sm font-semibold ${lightMode ? "text-gray-900" : "text-slate-100"
                    }`}
                >
                  {userName}
                </p>

                <p
                  className={`mt-1 text-xs ${lightMode ? "text-gray-500" : "text-slate-400"
                    }`}
                >
                  Manage your account
                </p>
              </div>

              {/* Account */}
              <button
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors ${lightMode
                    ? "text-gray-700 hover:bg-gray-50"
                    : "text-slate-200 hover:bg-slate-800"
                  }`}
                onClick={() => {
                  setIsOpen(false);
                  router.push("/account");
                }}
              >
                <User size={17} />
                Account
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                type="button"
                disabled={loggingOut}
                className={`flex w-full items-center gap-3 border-t px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 ${lightMode ? "border-gray-100" : "border-slate-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <LogOut size={17} />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={toggleMode}
          type="button"
          aria-label={lightMode ? "Switch to dark mode" : "Switch to light mode"}
          className={`mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 sm:mr-3 ${lightMode
              ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              : "border-slate-700 bg-slate-800 text-yellow-200 hover:bg-slate-700"
            }`}
        >
          {lightMode ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
}

export default Header;

