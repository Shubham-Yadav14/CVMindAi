"use client";

import React from 'react'
import Sidebar from '../components/sidebar/Sidebar'
import Header from '../components/header/Header'
import { usePathname } from "next/navigation";

function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  if (/^\/projects\/[^/]+$/.test(pathname)) return <>{children}</>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <div className='flex min-w-0 w-full flex-col'>
        <Header />
        <div className='h-[90vh] flex-1 overflow-auto noSideBar'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
