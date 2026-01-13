"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import styles from "./nav.module.css";
import { motion } from "framer-motion";


export default function NavHero() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* NAV */}
      <div
        className={`relative bg-[#0a0b10] flex items-center justify-between mx-3 rounded-tl-xl rounded-tr-xl px-4 md:px-8 py-3 ${styles.heroNoise}`}
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
        <div className="pointer-events-none absolute inset-0 rounded-tl-xl rounded-tr-xl bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_1%,black)] dark:bg-black" />

        {/* CONTENT */}
        <div className="relative z-10 flex w-full items-center justify-between gap-1.5 pt-2">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-1.5">
            <img
              src="https://projects.100xdevs.com/_next/image?url=https%3A%2F%2Fappx-wsb-gcp.akamai.net.in%2Fsubject%2F2023-01-17-0.17044360120951185.jpg&w=640&q=75"
              className="w-11 h-11 rounded-full"
              alt="Devforces Logo"
            />
            <span className="text-3xl font-semibold text-white">
              Devforces
            </span>
          </Link>

          {/* DESKTOP LINKS (UNCHANGED) */}
          <div className="hidden md:flex h-full items-end justify-end gap-6 font-medium text-base text-gray-300 tracking-tight">
            <span>Home</span>
            <span>Products</span>
            <span>Docs</span>
            <span>FAQ</span>
            <span>Pricing</span>
          </div>

          {/* DESKTOP CTA */}
          <div className="hidden md:block">
            <button className="bg-white h-10 px-8 rounded-md text-[13px] text-black m-1 tracking-tight font-medium">
              Signup Now
            </button>
          </div>

          {/* HAMBURGER — ONLY ADDITION */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col gap-1.5"
          >
            <span className="w-6 h-[2px] bg-white" />
            <span className="w-6 h-[2px] bg-white" />
            <span className="w-6 h-[2px] bg-white" />
          </motion.button>

        </div>
      </div>

      {/* MOBILE MENU (SEPARATE, NO RADIUS CHANGE ABOVE) */}
      {open && (
        <div className="md:hidden mx-3 bg-[#0a0b10] border-t border-white/10 px-4 py-4 text-gray-300 space-y-4">
          <span className="block">Home</span>
          <span className="block">Products</span>
          <span className="block">Docs</span>
          <span className="block">FAQ</span>
          <span className="block">Pricing</span>

          <button className="w-full bg-white h-10 rounded-md text-sm text-black font-medium">
            Signup Now
          </button>
        </div>
      )}
    </div>
  );
}
