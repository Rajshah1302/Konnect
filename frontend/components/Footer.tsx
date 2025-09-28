"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Normalize active page detection
  let activePage: string = "/";
  if (pathname === "/" || pathname === "") activePage = "/";
  else if (pathname.startsWith("/EventCreationPage")) activePage = "/EventCreationPage";
  else if (pathname.startsWith("/home")) activePage = "/home";
  else if (pathname.startsWith("/realms")) activePage = "/realms";
  else if (pathname.startsWith("/explore")) activePage = "/explore";
  else if (pathname.startsWith("/profile")) activePage = "/profile";

  const pages = [
    { label: "Home", key: "/", activeBg: "bg-blue-600", hoverBg: "hover:bg-blue-500" },
    { label: "Realms", key: "/realms", activeBg: "bg-green-600", hoverBg: "hover:bg-green-500" },
    { label: "Explore", key: "/explore", activeBg: "bg-yellow-600", hoverBg: "hover:bg-yellow-500" },
    { label: "Create", key: "/EventCreationPage", activeBg: "bg-purple-600", hoverBg: "hover:bg-purple-500" },
    // { label: "Avatar", key: "/profile", activeBg: "bg-orange-600", hoverBg: "hover:bg-orange-500" },
  ];

  return (
    <>
      <footer className="fixed bottom-0 z-50 w-full bg-black shadow-lg border-t-2 border-solid border-white animate-slide-up">
        <div className="flex w-full divide-x-2 divide-solid divide-white">
          {pages.map((page) => {
            const href = page.key; // ✅ Already normalized absolute path
            const isActive = activePage === page.key;

            return (
              <div
                key={page.key}
                className={`flex-1 text-center py-4 transition-all duration-300 text-white font-bold ${
                  isActive ? page.activeBg : page.hoverBg
                }`}
              >
                <a
                  href={href}
                  className={`flex items-center justify-center h-full w-full text-center ${
                    isActive ? "text-white" : "text-gray-300"
                  }`}
                >
                  {page.label}
                </a>
              </div>
            );
          })}
        </div>
      </footer>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(300%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
}
