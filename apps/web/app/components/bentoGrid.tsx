
"use client"

import React, { useState, useEffect } from 'react';
import { CheckIcon, FolderIcon } from './Icons';

const BentoGrid: React.FC = () => {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 5;
        const increment = prev < 30 ? 2 : prev < 70 ? 1 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 scale-[0.97] origin-top">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch tracking-tight">

        {/* Grid 1: Automated Grading - 7 columns */}
        <div className="md:col-span-7 glass rounded-[2.5rem] p-10 bento-card border border-slate-200 flex flex-col justify-between overflow-hidden group min-h-[500px] ">
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="w-full max-w-[520px] bg-white rounded-[2.5rem]  p-10 transform transition-transform group-hover:scale-[1.02] duration-500">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-bold text-slate-800 tracking-tight">Analyzing code structure...</h4>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assessment Status</span>
                  <span className="text-2xl font-black text-slate-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-75 linear"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Code quality check", status: "Passed", threshold: 20 },
                  { label: "Unit test coverage", status: "87%", threshold: 45 },
                  { label: "Plagiarism detection", status: "Passed", threshold: 70 },
                  { label: "Score Calculation", status: "95%", threshold: 90 },
                ].map((item, idx) => {
                  const isDone = progress >= item.threshold;
                  return (
                    <div key={idx} className="flex items-center justify-between pb-1 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                          {!isDone ? (
                            <div className="w-5 h-5 border-2 border-slate-100 rounded-full"></div>
                          ) : (
                            <div className="bg-emerald-50 p-1 rounded-full"><CheckIcon /></div>
                          )}
                        </div>
                        <span className={`text-base ${!isDone ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>{item.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${!isDone ? 'text-slate-100' : 'text-emerald-500'}`}>
                        {!isDone ? 'Pending' : item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Automated Grading</h3>
            <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
              From code analysis to plagiarism detection, get instant feedback on every submission.
            </p>
          </div>
        </div>

        {/* Grid 2: Vertical Stack - 5 columns */}
        <div className="md:col-span-5 flex flex-col gap-4">

          {/* Box A: Upload Folder - Premium Design with Hand Interaction */}
          <div className="flex-1 glass rounded-[2.5rem] p-8 bento-card border border-slate-200 flex flex-col justify-between overflow-hidden group min-h-[350px] ">
            <div className="flex-1 flex items-center justify-center relative pt-4 ">
              {/* Dotted Container Area */}
              <div className="w-64 h-64 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center  relative overflow-hidden bg-slate-50/30">

                {/* Background Dotted Shape */}
                <div className="absolute opacity-[0.05] pointer-events-none select-none scale-150">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="35" r="15" fill="currentColor" />
                    <path d="M20 85 C20 60, 80 60, 80 85" fill="currentColor" />
                  </svg>
                </div>

                {/* Interactive Drag Group */}

                <div className="relative z-10 scale-95 drag-animation flex items-center justify-center">

                  {/* Premium Project Folder */}
                  <div className="relative w-40 h-32 group-hover:scale-105 transition-transform duration-700">
                    {/* Back Plate */}
                    <div className="absolute inset-0 bg-sky-600 rounded-2xl shadow-lg">
                      <div className="absolute -top-3 left-0 w-20 h-8 bg-sky-600 rounded-t-xl"></div>
                    </div>

                    {/* Internal Assets (peeking out) */}
                    <div className="absolute top-2 left-4 right-4 h-20 bg-white rounded shadow-sm translate-y-[-8px] rotate-[-2deg] flex flex-col p-2 gap-1.5 z-10">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
                      <div className="h-1.5 w-4/5 bg-slate-100 rounded-full"></div>
                      <div className="h-1.5 w-full bg-sky-50 rounded-full"></div>
                    </div>
                    <div className="absolute top-2 left-6 right-2 h-20 bg-emerald-50 border border-emerald-100 rounded shadow-sm translate-y-[-16px] rotate-[3deg] z-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400/50"></div>
                    </div>

                    {/* Front Flap (Glassmorphic) */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-sky-500/80 backdrop-blur-md rounded-2xl border-t border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)] z-20 flex flex-col justify-end p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest opacity-90">Assignment</span>
                      </div>
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-1/3"></div>
                      </div>
                    </div>
                  </div>

                  {/* The Interactive Hand Cursor */}
                  <div className="absolute -bottom-4 -right-2 z-30 pointer-events-none hand-grip-animation">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                      <path
                        d="M18.5 11C18.5 9.62 17.38 8.5 16 8.5C15.82 8.5 15.65 8.52 15.48 8.56C15.19 7.65 14.35 7 13.35 7C13.11 7 12.88 7.04 12.67 7.11C12.31 6.17 11.41 5.5 10.35 5.5C10.08 5.5 9.83 5.54 9.59 5.61V3.5C9.59 2.12 8.47 1 7.09 1C5.71 1 4.59 2.12 4.59 3.5V13.84C4.16 13.56 3.65 13.4 3.1 13.4C2.08 13.4 1.25 14.23 1.25 15.25V15.49L3.48 20.94C4.1 22.45 5.58 23.44 7.21 23.44H13.85C16.14 23.44 18 21.58 18 19.29L18.5 11Z"
                        fill="white"
                        stroke="#1e293b"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                </div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Batch Upload</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Seamlessly upload entire project folders with a single drag-and-drop.
              </p>
            </div>
          </div>

          {/* Box B: Instant Delivery */}
          <div className="flex-1 glass rounded-[2.5rem] p-8 bento-card border border-slate-200 flex flex-col justify-between overflow-hidden group min-h-[340px]">
            <div className="flex-1 flex items-center justify-center pt-2">
              <div className="flex items-center justify-between w-full max-w-[280px] relative px-1 scale-120   ">
                <FolderIcon label="Server" active={true} />

                <div className="flex-1 h-[2px] bg-slate-100 mx-0 relative overflow-hidden self-center mt-4">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <line
                      x1="0" y1="1" x2="100%" y2="1"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="6 12"
                      className="animate-flow"
                      style={{ filter: 'drop-shadow(0 0 2px #10b981)' }}
                    />
                  </svg>
                </div>

                <FolderIcon label="Student" active={true} isStudent={true} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Instant Delivery</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Automated student distribution with file previews.
              </p>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes flow {
          0% { stroke-dashoffset: 18; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes dragFolder {
          0% { transform: translate(-10px, 10px) rotate(-2deg); }
          50% { transform: translate(10px, -10px) rotate(2deg); }
          100% { transform: translate(-10px, 10px) rotate(-2deg); }
        }
        @keyframes handGrip {
          0% { transform: scale(1); }
          50% { transform: scale(0.95) translate(-2px, -2px); }
          100% { transform: scale(1); }
        }
        .animate-flow {
          animation: flow 1s linear infinite;
        }
        .drag-animation {
          animation: dragFolder 6s ease-in-out infinite;
        }
        .hand-grip-animation {
          animation: handGrip 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default BentoGrid;
