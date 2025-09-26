"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

// Wrapper component to overlay text and buttons on top of the grid.
export function Hero() {
  const router = useRouter();

  // Multiple subtitles
  const subtitles = [
    "Host and join fully verified virtual events with trust and transparency.",
    "Experience the future of networking in immersive 3D spaces.",
    "Connect with real people, in real time, with real security.",
  ];

  const [index, setIndex] = useState(0);

  // Cycle through subtitles every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [subtitles.length]);

  return (
    <div className="relative h-screen w-full -top-[50px] overflow-hidden bg-black">
      {/* Background video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="/bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay tint for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Centered text */}
      <div className="absolute top-[47%] left-1/2 z-10 transform -translate-x-1/2 -translate-y-1/2 text-center z-100">
        <Image
          src="/colosseum.png"
          alt="Colosseum"
          width={800} // adjust width as needed
          height={400} // adjust height as needed
          className="object-contain"
          priority // loads immediately for hero images
        />
        {/* Animated subtitles */}
        <div className="h-8 -mt-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              className="text-gray-300 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              {subtitles[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
