"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const ContractGamePage: React.FC = () => {
  const params = useParams();
  const contractAddress = params.contractAddress as string;
  const [error, setError] = useState<string>("");

  // Your game server URL - adjust this to match your backend
  const GAME_SERVER_URL =
    process.env.NODE_ENV === "production"
      ? "https://your-game-server.com"
      : "http://localhost:3000";

  useEffect(() => {
    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setError("Invalid contract address format");
      return;
    }

    // Prevent all scrolling behaviors
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // More comprehensive scroll prevention
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    
    // Prevent scroll events
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('scroll', preventScroll, { passive: false });

    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      // Verify the origin for security
      if (event.origin !== GAME_SERVER_URL.replace(/:\d+$/, '')) {
        return;
      }

      // Handle navigation requests from the iframe
      if (event.data.type === 'navigate') {
        window.location.href = event.data.url;
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
      document.body.style.height = "unset";
      
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('scroll', preventScroll);
      window.removeEventListener('message', handleMessage);
    };
  }, [contractAddress, GAME_SERVER_URL]);

  // Handle iframe load
  const handleIframeLoad = () => {
    console.log("Game iframe loaded");
  };

  const handleIframeError = () => {
    console.error("Failed to load game");
    setError("Failed to load game");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Game Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col mt-8">
      {/* Game container */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-black">
          <iframe
            src={`${GAME_SERVER_URL}/game/${contractAddress}`}
            className="absolute inset-0 w-full h-full border-0"
            title={`Multiplayer Pokemon Game - ${contractAddress}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            // Updated sandbox with navigation permissions
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-top-navigation allow-popups"
            allow="gamepad; microphone; camera"
            style={{
              border: 'none',
              outline: 'none',
              overflow: 'hidden'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContractGamePage;