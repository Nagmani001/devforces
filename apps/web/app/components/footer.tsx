"use client"
import React from "react"
import { cn } from "@repo/ui/lib/utils";
import styles from './hero.module.css'
import Link from "next/link";

export default function Footer() {
  return (
    <div
      className={`relative flex h-90 w-auto m-3 mt-24 overflow-hidden rounded-xl items-center justify-center bg-card dark:bg-[#0a0b10] ${styles["hero-noise"]}`}
    >

      {/* Grid Background */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:90px_90px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,rgba(50,51,56,0.45)_1.8px,transparent_1.8px),linear-gradient(to_bottom,rgba(50,51,56,0.45)_1.8px,transparent_1.8px)]"
        )}
      />

      {/* Radial gradient for faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="z-99 flex flex-col justify-center items-center gap-3">

        <h2 className="z-0 font-semibold tracking-tight text-4xl text-center text-foreground">Standardize Skill Evaluation at Scale</h2>
        <div className="text-muted-foreground text-center">Run secure, real-world development challenges across teams, cohorts, or institutions.</div>

        <Link href="/signup">
          <button className="bg-primary text-primary-foreground h-10 px-8 rounded-md text-[14px] m-1 tracking-tight font-medium hover:bg-primary/90 transition-colors">
            Get started
          </button>
        </Link>
      </div>
    </div>
  )
}
