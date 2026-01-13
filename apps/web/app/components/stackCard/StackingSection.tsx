"use client"

import React, { useRef } from 'react';
import { useScroll, motion } from 'framer-motion';
import { CARDS_DATA } from './constants';
import Card from './Card';

const StackingSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of this specific section relative to the viewport
  // Increased height to 500vh for a more premium, slower scroll experience
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  return (
    <section 
      ref={containerRef} 
      className="relative h-[500vh] bg-[#fdfdfd]"
    >
      {/* 
          Sticky Wrapper: This stays pinned to the top while we scroll 
          through the 500vh height of the parent.
      */}
      <div className="sticky top-0 h-screen w-full flex overflow-hidden ">
        
        {/* Left Section (30% Width) - Sticky Content */}
        <div className="hidden bg-[#fcfcfc] md:flex w-[35%] h-full flex-col justify-center px-10 lg:px-20 border-r border-gray-100 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.01)] z-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xs"
          >
            <span className="text-[10px] font-medium tracking-[0.3em] text-[#5090f2] uppercase mb-6 block">
              WHY US ??
            </span>
            <h2 className='text-5xl text-gray-800 font-semibold tracking-tight mb-6'>Because some Skills deserve real testing.</h2>
            <div className='text-base text-gray-500'>Backend development can’t be judged by MCQs or toy problems. <br/>
We test real server side code using real test files.</div>
          </motion.div>
        </div>

        {/* Right Section (70% Width) - Stacking Cards Area */}
        <div className="w-full md:w-[70%] h-full relative  border-slate-200 bg-white">
           <div className="h-full w-full relative ">
             {CARDS_DATA.map((card, i) => {
               return (
                 <Card 
                   key={card.id} 
                   card={card} 
                   index={i} 
                   progress={scrollYProgress} 
                   totalCards={CARDS_DATA.length}
                 />
               );
             })}
           </div>
        </div>
      </div>
    </section>
  );
};

export default StackingSection;