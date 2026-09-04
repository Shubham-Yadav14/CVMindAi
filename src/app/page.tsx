"use client";

import { FilePlus2, FolderOpen, LayoutTemplate, Sparkles } from "lucide-react";
import Link from "next/link";
import useModeStore from "./lib/useModeStore";
import Header from "./components/header/Header";
import Sidebar from "./components/sidebar/Sidebar";

export default function HomePage() {
  const { lightMode } = useModeStore();
  const panel = lightMode ? "border-slate-200 bg-white" : "border-slate-700 bg-[#17232d]";
  const muted = lightMode ? "text-slate-600" : "text-slate-400";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="app-surface min-h-0 flex-1 overflow-auto px-5 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-600"><Sparkles size={16} /> Resume studio</p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Make your next move look unmistakable.</h1>
              <p className={`mt-4 text-base leading-7 ${muted}`}>Build, refine, and export a resume that feels like you, without starting from a blank page.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <Link href="/new_project" className={`group rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg ${panel}`}>
                <FilePlus2 className="mb-10 text-teal-600" size={28} />
                <h2 className="text-lg font-semibold">Start a resume</h2><p className={`mt-2 text-sm ${muted}`}>Choose a name and a polished template.</p>
              </Link>
              <Link href="/projects" className={`group rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg ${panel}`}>
                <FolderOpen className="mb-10 text-teal-600" size={28} />
                <h2 className="text-lg font-semibold">Open your projects</h2><p className={`mt-2 text-sm ${muted}`}>Pick up where you left off.</p>
              </Link>
              <Link href="/new_project" className={`group rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg ${panel}`}>
                <LayoutTemplate className="mb-10 text-teal-600" size={28} />
                <h2 className="text-lg font-semibold">Explore layouts</h2><p className={`mt-2 text-sm ${muted}`}>Find the right frame for your story.</p>
              </Link>
            </div>
            <section className={`mt-8 rounded-2xl border p-6 ${panel}`}>
              <p className="text-sm font-semibold text-teal-600">A calmer way to build</p>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>Keep versions organized, make edits in context, and return to your strongest draft whenever inspiration strikes.</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
