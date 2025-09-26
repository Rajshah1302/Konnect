"use client";

import React, { useState, useEffect } from "react";

/**
 * A mock loading window that shows a date, a close button, 
 * and an initializing progress bar going from 1% to 100%.
 */
export default function MockLoadingWindow() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Increment progress from 1 to 100, super fast
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgress(current);
      if (current === 100) {
        clearInterval(interval);
      }
    }, 10); // Only 10ms between increments (super fast)
    return () => clearInterval(interval);
  }, []);

  // Number of squares for the progress bar
  const squaresCount = 20;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      {/* Window-like container */}
      <div className="w-[500px] h-[500px] bg-[#0d1117] border border-gray-700 rounded shadow-lg overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
          <date className="text-sm text-gray-300">February - May, 2025</date>
          <button className="text-gray-300 hover:text-white transition">X</button>
        </div>

        {/* Main content */}
        <div className="p-6">
          {/* Loading Header */}
          <div className="flex items-center space-x-3 mb-4">
            {/* Icon (mock) */}
            <div className="w-6 h-6 flex items-center justify-center bg-purple-500 text-white font-bold rounded">
              →
            </div>
            <span className="text-lg font-semibold tracking-wide">
              INITIALIZING...
            </span>
            <span className="ml-auto text-sm text-gray-400">{progress}%</span>
          </div>

          {/* Progress Bar (Squares) */}
          <div className="flex gap-1">
            {Array.from({ length: squaresCount }).map((_, i) => {
              // Determine if this square should be filled
              const filledUpTo = Math.floor((progress / 100) * squaresCount);
              const isFilled = i < filledUpTo;
              return (
                <div
                  key={i}
                  className={`w-3 h-6 border border-blue-500 ${
                    isFilled ? "bg-blue-500" : "bg-transparent"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
