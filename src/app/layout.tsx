"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import useModeStore from "./lib/useModeStore";
import { useEffect } from "react";
import { SnackbarProvider } from "./components/ui/SnackbarProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { lightMode } = useModeStore();

  useEffect(() => {
    const theme = lightMode ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, [lightMode]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme={lightMode ? "light" : "dark"}
    >
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <SnackbarProvider>{children}</SnackbarProvider>
      </body>
    </html>
  );
}
