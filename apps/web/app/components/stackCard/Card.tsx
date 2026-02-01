"use client"


import React from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';


interface CardProps {
  card: CardData;
  index: number;
  totalCards: number;
  progress: MotionValue<number>;
}

interface CardData {
  id: number;
  title: string;
  subtitle: string;
  color: string;
}


const Card: React.FC<CardProps> = ({ card, index, totalCards, progress }) => {
  // Define active range for the card's entry
  // settlePoint: When the card is fully in place in the stack
  const settlePoint = (index + 1) / totalCards;
  const entryStart = index / totalCards;

  // Y-axis Parallax:
  // Initial cards (index 0) are already visible, others move up from the bottom.
  // We use a sticky-like offset for the final position.
  const finalTopOffset = 100 + (index * 50); // Increased offset for better stacking visibility
  
  const y = useTransform(
    progress, 
    [0, settlePoint], 
    [index === 0 ? 0 : 1000, 0] 
  );

  // Scaling logic: Cards scale down as subsequent cards arrive to create depth
  const scale = useTransform(
    progress,
    [settlePoint, 1],
    [1, 1 - (totalCards - index - 1) * 0.025] 
  );

  // Opacity: Smooth fade in
  const opacity = useTransform(
    progress,
    [Math.max(0, entryStart - 0.05), Math.min(1, entryStart + 0.1)],
    [0, 1]
  );

  return (
    <motion.div
      style={{
        y,
        scale,
        opacity,
        top: `${finalTopOffset}px`,
        zIndex: index,
      }}
      className="absolute left-0 right-0 flex items-center justify-center px-4"
    >
      <div style={{ backgroundColor: card.color }}
        className={`relative h-[300px] w-full max-w-[860px] rounded-[32px] p-10 md:p-12 flex flex-col justify-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.25)] border border-black/5 overflow-hidden transition-shadow duration-500 hover:shadow-xl`}
      >
        <div className="z-10 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                 <div className="w-3 h-3 bg-black/70 rounded-sm rotate-45" />
            </div>
            <span className="text-xs font-medium font-mono uppercase text-black tracking-widest opacity-30">Why Not us 0{index + 1} ??</span>
          </div>

          <h3 className="text-3xl md:text-4xl font-medium text-gray-900 tracking-tighter mb-4 leading-tight max-w-xl">
            {card.title}
          </h3>
          <p className="text-base md:text-lg text-gray-700 max-w-lg leading-relaxed tracking-tight font-medium">
            {card.subtitle}
          </p>

          <div className="mt-8">
            <button className="group flex items-center gap-2 text-sm font-bold text-black/80 hover:text-black transition-colors">
                Explore
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </button>
          </div>
        </div>

        {/* Dynamic Abstract Background elements - Adjusted for horizontal long shape */}
        <div className="absolute inset-0 pointer-events-none">
            <motion.div
                animate={{
                    rotate: [0, -5, 0],
                    scale: [1, 1.02, 1]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -right-10 -bottom-10 w-[400px] h-[400px] border-[50px] border-black/[0.03] rounded-full"
            />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/20 to-transparent" />
        </div>

        {/* Subtle Index - Positioned for the new aspect ratio */}
        <div className="absolute top-10 right-12 font-black text-[120px] leading-none pointer-events-none select-none text-black/[0.06]">
          {index + 1}
        </div>
      </div>
    </motion.div>
  );
};

export default Card;