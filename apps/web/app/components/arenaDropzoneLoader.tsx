"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2, Code2, Cpu, CheckCircle2, CloudUpload } from "lucide-react";

const loadingStates = [
    { text: "Compressing files...", icon: Code2 },
    { text: "Uploading to server...", icon: CloudUpload },
    { text: "Analyzing submission...", icon: Cpu },
    { text: "Running test cases...", icon: Loader2 },
    { text: "Finalizing results...", icon: CheckCircle2 },
];



export function ArenaDropzoneLoader() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % loadingStates.length);
        }, 2500); // Change state every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = loadingStates[currentIndex].icon;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border-2 border-dashed border-primary/20 relative overflow-hidden">
            {/* Background Pulse Effect */}
            <motion.div
                className="absolute inset-0 bg-primary/5"
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.02, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <div className="z-10 flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="p-4 bg-background rounded-full shadow-lg ring-1 ring-border border border-border/50">
                            <CurrentIcon className="w-8 h-8 text-primary animate-pulse" />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-semibold tracking-tight">
                                Processing Submission
                            </h3>
                            <p className="text-muted-foreground min-w-[200px]">
                                {loadingStates[currentIndex].text}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Progress Bar */}
                <div className="mt-8 w-64 h-2 bg-muted rounded-full overflow-hidden">
                    {/* Progress Bar Animation to give a feeling of progress */}
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: 12.5, // Total approximate duration or loop
                            ease: "linear",
                            repeat: Infinity
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
