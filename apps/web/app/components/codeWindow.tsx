"use client";

import React from 'react';
import styles from './codeWindow.module.css'

export const CodeWindow: React.FC = () => {
  return (
    <div className={`relative w-full max-w-2xl mx-auto ${styles["animate-float"]}`}>
      <div className="group relative transform transition-all duration-500 hover:scale-[1.01]">

        {/* Bluish Gradient Glow / Drop Shadow */}
        <div
          className="absolute -inset-0.5 
        bg-gradient-to-r 
        from-[rgba(80,144,242,1)] 
        via-[rgba(80,144,242,1)] 
        to-[rgba(80,144,242,1)] 
        rounded-xl blur opacity-5 
        group-hover:opacity-10 
        transition duration-1000 
        group-hover:duration-200 
        animate-tilt"
        ></div>

        {/* Floating Status Badge */}
        <div className="absolute -top-6 -right-2 z-20 transform translate-y-4 group-hover:-translate-y-2 transition-transform duration-500 ease-out float2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0b10] border border-white/10 rounded-full shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              System Status: <span className="text-green-400 font-semibold">Scaling</span>
            </span>
          </div>
        </div>

        {/* Main Window */}
        <div className="relative flex flex-col bg-[#0f0f12] rounded-xl border border-white/5 shadow-2xl overflow-hidden">

          {/* Window Controls Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
              <span className="opacity-50">sh ~/projects/</span>challenge.js
            </div>
            <div className="w-12"></div> {/* Spacer for alignment */}
          </div>

          {/* Code Content */}
          <div className="p-6 overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed">
              <code>
                <span className="text-purple-400">type</span>{' '}
                <span className="text-yellow-200">Equal</span>
                <span className="text-gray-400">{'<'}</span>
                <span className="text-red-400">X</span>
                <span className="text-gray-400">, </span>
                <span className="text-red-400">Y</span>
                <span className="text-gray-400">{'>'} =</span>
                {'\n'}
                {'  '}
                <span className="text-gray-400">(</span>
                <span className="text-blue-400">{'<'}</span>
                <span className="text-yellow-200">T</span>
                <span className="text-blue-400">{'>'}</span>
                <span className="text-gray-400">()</span>{' '}
                <span className="text-purple-400">={'>'}</span>{' '}
                <span className="text-yellow-200">T</span>{' '}
                <span className="text-purple-400">extends</span>{' '}
                <span className="text-red-400">X</span>{' '}
                <span className="text-purple-400">?</span>{' '}
                <span className="text-blue-400">1</span>{' '}
                <span className="text-purple-400">:</span>{' '}
                <span className="text-blue-400">2</span>
                <span className="text-gray-400">)</span>{' '}
                <span className="text-purple-400">extends</span>
                {'\n'}
                {'  '}
                <span className="text-gray-400">(</span>
                <span className="text-blue-400">{'<'}</span>
                <span className="text-yellow-200">T</span>
                <span className="text-blue-400">{'>'}</span>
                <span className="text-gray-400">()</span>{' '}
                <span className="text-purple-400">={'>'}</span>{' '}
                <span className="text-yellow-200">T</span>{' '}
                <span className="text-purple-400">extends</span>{' '}
                <span className="text-red-400">Y</span>{' '}
                <span className="text-purple-400">?</span>{' '}
                <span className="text-blue-400">1</span>{' '}
                <span className="text-purple-400">:</span>{' '}
                <span className="text-blue-400">2</span>
                <span className="text-gray-400">)</span>{' '}
                <span className="text-purple-400">?</span>{' '}
                <span className="text-blue-400">true</span>{' '}
                <span className="text-purple-400">:</span>{' '}
                <span className="text-blue-400">false</span>
                <span className="text-gray-400">;</span>
                {'\n\n'}
                <span className="text-gray-500 italic">// Ik its gonna be hard hehehe</span>
              </code>
            </pre>
          </div>

          {/* Subtle scanline effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};
