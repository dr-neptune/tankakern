import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PE Lab",
  description: "Private Equity Lab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="night" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        {/*
          Main wrapper using DaisyUI / Tailwind classes.
          We ensure the container is at least the full viewport height (min-h-screen).
          Then we make the container a flex layout, with the sidebar pinned on the left
          and the main content scrollable.
        */}
        <div className="flex min-h-screen h-full bg-base-200">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
