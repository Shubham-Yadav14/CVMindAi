"use client";

import React, { useEffect, useState } from 'react'
import Sidebar from '../components/sidebar/Sidebar'
import Header from '../components/header/Header'
import { usePathname } from "next/navigation";

function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (/^\/projects\/[^/]+$/.test(pathname)) return <>{children}</>;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--background)]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 md:hidden"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className='flex min-w-0 w-full flex-col'>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className='min-h-0 flex-1 overflow-auto noSideBar'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
