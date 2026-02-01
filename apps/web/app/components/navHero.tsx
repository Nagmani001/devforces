"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import styles from "./nav.module.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ThemeToggle from "./themeToggle";


export default function NavHero() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      {/* NAV */}
      <div
        className={`relative bg-card dark:bg-[#0a0b10] flex items-center justify-between mx-3 rounded-tl-xl rounded-tr-xl px-4 md:px-8 py-3 ${styles.heroNoise}`}
      >
        {/* BACKGROUND GRID */}
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:90px_90px]",
            "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
            "dark:[background-image:linear-gradient(to_right,rgba(50,51,56,0.45)_1.8px,transparent_1.8px),linear-gradient(to_bottom,rgba(50,51,56,0.45)_1.8px,transparent_1.8px)]"
          )}
        />

        {/* MASK */}
        <div className="pointer-events-none absolute inset-0 rounded-tl-xl rounded-tr-xl bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_1%,black)]" />

        {/* CONTENT */}
        <div className="relative z-10 flex w-full items-center justify-between gap-1.5 pt-2">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-1.5">
            <img
              src="https://projects.100xdevs.com/_next/image?url=https%3A%2F%2Fappx-wsb-gcp.akamai.net.in%2Fsubject%2F2023-01-17-0.17044360120951185.jpg&w=640&q=75"
              className="w-11 h-11 rounded-full"
              alt="Devforces Logo"
            />
            <span className="text-3xl font-semibold text-foreground">
              Devforces
            </span>
          </Link>

          {/* DESKTOP LINKS (UNCHANGED) */}
          <div className="hidden md:flex h-full items-end justify-end gap-6 font-medium text-base text-muted-foreground tracking-tight">
            <span>Home</span>
            <span>Products</span>
            <span>Docs</span>
            <span>FAQ</span>
            <span>Pricing</span>
          </div>

          {/* DESKTOP CTA */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => {
                router.push("/signup")
              }}
              className="bg-primary text-primary-foreground h-10 px-8 rounded-md text-[13px] tracking-tight font-medium hover:bg-primary/90 transition-colors">
              Signup Now
            </button>
          </div>

          {/* MOBILE CONTROLS */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(!open)}
              className="flex flex-col gap-1.5"
            >
              <span className="w-6 h-[2px] bg-foreground" />
              <span className="w-6 h-[2px] bg-foreground" />
              <span className="w-6 h-[2px] bg-foreground" />
            </motion.button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU (SEPARATE, NO RADIUS CHANGE ABOVE) */}
      {open && (
        <div className="md:hidden mx-3 bg-card dark:bg-[#0a0b10] border-t border-border px-4 py-4 text-muted-foreground space-y-4">
          <span className="block">Home</span>
          <span className="block">Products</span>
          <span className="block">Docs</span>
          <span className="block">FAQ</span>
          <span className="block">Pricing</span>

          <button className="w-full bg-primary text-primary-foreground h-10 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Signup Now
          </button>
        </div>
      )}
    </div>
  );
}
