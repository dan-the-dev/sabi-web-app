import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthCallbackHandler } from "@/app/components/AuthCallbackHandler";
import { LogoutButton } from "./components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { createAuth } from "@/lib/supabase/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sabi",
  description: "Sabi app",
  icons: {
    icon: "/sabi-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const auth = createAuth(supabase);
  const user = await auth.getUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex h-screen flex-col antialiased`}
        data-theme="sabi-theme"
      >
        <AuthCallbackHandler />
        <header className="shrink-0 border-b border-base-300 bg-base-100">
          <div
            className={`flex items-center px-4 py-3 ${user ? "justify-between" : "justify-center md:justify-start"}`}
          >
            <Link href="/" className="w-40 shrink-0 flex justify-center">
              <Image
                src="/sabi-banner.png"
                alt="Sabi"
                width={176}
                height={48}
                priority
                className="h-auto w-24 object-contain object-left md:object-left"
              />
            </Link>
            {user ? <LogoutButton /> : null}
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
        <footer className="shrink-0 border-t border-base-300 bg-base-100 px-4 py-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 text-center text-sm text-base-content/70">
            <p>Built with love</p>
            <p>© {new Date().getFullYear()} Sabi. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
