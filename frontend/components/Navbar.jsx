"use client";

import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black shadow-lg border-b-2 border-solid border-white animate-slide-down">
        <div className="text-2xl font-bold text-white">
          <a href="/" className="hover:text-purple-400 transition-colors duration-200">
            COLOSSEUM
          </a>
        </div>
        <ConnectButton />
      </nav>
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
}