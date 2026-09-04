"use client"
import React from "react";
import {
  Plus,
  FolderOpen,
  Trash2,
  User,
  FileText,
  Archive,
} from "lucide-react";
import useModeStore from "@/app/lib/useModeStore";

import { usePathname, useRouter } from "next/navigation";

function Sidebar() {
  const { lightMode } = useModeStore();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const activeItemClass = lightMode
    ? "bg-teal-50 text-teal-800 shadow-sm"
    : "bg-teal-950/70 text-teal-200 shadow-sm";

  const inactiveItemClass = lightMode
    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100";

  return (
    <aside
      className={`flex h-screen w-64 shrink-0 flex-col border-r px-4 py-6 transition-colors duration-300 ${
        lightMode
          ? "border-slate-200 bg-white"
          : "border-slate-700 bg-[#14202a]"
      }`}
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-[0_8px_20px_rgba(15,118,110,0.22)]">
          <FileText size={22} />
        </div>

        <div>
          <h1
            className={`text-lg font-bold ${
              lightMode ? "text-slate-950" : "text-slate-100"
            }`}
          >
            ResumeIQ
          </h1>
          <p
            className={`text-xs ${
              lightMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Build your career
          </p>
        </div>
      </div>

      {/* New Project */}
      <button
      onClick={()=>{router.push("/new_project")}}
        className="focus-ring mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.2)] transition-all duration-200 hover:bg-teal-800 hover:shadow-md active:scale-[0.98]"
      >
        <Plus size={18} />
        New Project
      </button>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        <p
          className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider ${
            lightMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Workspace
        </p>

        <button
          onClick={() => router.push("/projects")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive("/projects") ? activeItemClass : inactiveItemClass
          }`}
        >
          <FolderOpen size={18} />
          Your Projects
        </button>

        <button
          onClick={() => router.push("/archieves")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive("/archieves") ? activeItemClass : inactiveItemClass
          }`}
        >
          <Archive size={18} strokeWidth={2} />
          Archieved
        </button>
        <button
          onClick={() => router.push("/trash")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive("/trash") ? activeItemClass : inactiveItemClass
          }`}
        >
          <Trash2 size={18} />
          Trash
        </button>
      </nav>

      {/* Account */}
      <div
        className={`border-t pt-4 ${
          lightMode ? "border-slate-200" : "border-slate-700"
        }`}
      >
        <button
          onClick={() => router.push("/account")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive("/account") ? activeItemClass : inactiveItemClass
          }`}
        >
          <User size={18} />
          Account
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

