"use client";

import { motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";
import styles from './hero.module.css'
import Link from "next/link";
import { CodeWindow } from "./codeWindow";

export default function Hero() {
  return (
    <div
      className={`relative flex h-auto w-auto m-3 mt-0 overflow-hidden rounded-bl-xl rounded-br-xl items-center justify-center bg-white dark:bg-[#0a0b10] ${styles["hero-noise"]}`}
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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />

      <div className="relative flex items-center flex-col justify-center p-5 h-full w-full min-h-[100vh] z-10">

        <div className="relative flex items-center flex-col justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`text-4xl md:text-6xl tracking-tighter font-bold text-center z-10 ${styles.heroheadinggradient}`}
          >
            Level Up Your Dev  <br />
            Game with <span className={styles.herogradienttext}>Devforces</span>
          </motion.div>
          <div className="text-[18px] tracking-tight text-gray-300 mt-5">Transform your ideas into reality with our cutting-edge platform. <br />Join thousands of innovators who are building the future today</div>
          <div className="gap-1.5 mt-5.5">
            <Link href="/signup">
              <button
                className="bg-white text-center w-48 rounded-4xl h-14 relative text-black text-xl font-semibold group"
                type="button"
              >
                <div
                  className="bg-[#4c96fe] rounded-4xl h-12 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    height="25px"
                    width="25px"
                    className=" text-white"

                  >
                    <path fill="currentColor" d="m31.71 15.29-10-10-1.42 1.42 8.3 8.29H0v2h28.59l-8.29 8.29 1.41 1.41 10-10a1 1 0 0 0 0-1.41z" data-name="3-Arrow Right" />
                    <path
                      d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <p className="translate-x-4 tracking-tight">Get Started</p>
              </button>
            </Link>
            {/* <button className="bg-white h-10 px-8 rounded-md text-[14px] text-black m-1 tracking-tight font-medium">
              View Demo
            </button> */}




          </div>
          <div className="mt-16 w-[1000px]  mx-auto flex justify-center perspective-[1000px]">
            <CodeWindow />
          </div>
        </div>

      </div>
    </div>
  );
}
