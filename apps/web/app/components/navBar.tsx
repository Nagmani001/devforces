"use client";

import { Button } from "@repo/ui/components/button";
import ThemeToggle from "./themeToggle";
import { useRouter } from "next/navigation";
import { useUserInfo } from "../hooks/useUser";
import Link from "next/link";
import { ReactNode } from "react";

interface NavBarProps {
  children?: ReactNode;
}

export default function NavBar({ children }: NavBarProps) {
  const router = useRouter();
  const user = useUserInfo();

  if (user.data) {
    return (
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://projects.100xdevs.com/_next/image?url=https%3A%2F%2Fappx-wsb-gcp.akamai.net.in%2Fsubject%2F2023-01-17-0.17044360120951185.jpg&w=640&q=75"
              className="w-8 h-8 rounded-full"
              alt="Devforces Logo"
            />
            <span className="text-lg font-semibold text-foreground">Devforces</span>
          </Link>
          {children && (
            <div className="flex-1 flex items-center justify-center gap-3">
              {children}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className={`relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-muted text-foreground font-bold text-sm ${user.data.isAdmin ? "ring-2 ring-yellow-400" : ""}`}>
              {user.data.imageUrl ? (
                <img src={user.data.imageUrl} alt={user.data.username} className="w-full h-full object-cover" />
              ) : (
                <span>{user.data.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  } else {
    return (
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://projects.100xdevs.com/_next/image?url=https%3A%2F%2Fappx-wsb-gcp.akamai.net.in%2Fsubject%2F2023-01-17-0.17044360120951185.jpg&w=640&q=75"
              className="w-8 h-8 rounded-full"
              alt="Devforces Logo"
            />
            <span className="text-lg font-semibold text-foreground">Devforces</span>
          </Link>
          {children && (
            <div className="flex-1 flex items-center justify-center gap-3">
              {children}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={() => {
              router.push("/signin")
            }} variant="ghost" size="sm" className="text-foreground">Login</Button>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    );
  }
} 
