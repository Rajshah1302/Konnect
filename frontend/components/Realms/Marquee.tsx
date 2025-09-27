'use client'
import React from "react";
import { Users, Calendar, MapPin } from "lucide-react";

const MarqueeEvent = ({ title, attendeeCount, location, onClick }) => (
  <div
    className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3 mx-4 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-all duration-300"
    onClick={onClick}
  >
    <Calendar size={14} className="text-blue-400" />
    <span className="text-white font-medium text-sm">{title}</span>
    <div className="flex items-center space-x-1 text-gray-400">
      <Users size={12} />
      <span className="text-xs">{attendeeCount}</span>
    </div>
    <div className="flex items-center space-x-1 text-gray-400">
      <MapPin size={12} />
      <span className="text-xs">{location}</span>
    </div>
  </div>
);

const Marquee = ({ events, onEventClick }) => {
  return (
    <div className="mb-16 overflow-hidden">
      <div className="flex items-center mb-6">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-blue-400/50"></div>
        <span className="px-4 text-blue-300 text-sm font-medium uppercase tracking-wide">
          Featured Realms
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
      </div>
      <div className="relative">
        <div className="flex animate-marquee">
          {[...events, ...events].map((event, idx) => (
            <MarqueeEvent
              key={idx}
              title={event.title}
              attendeeCount={event.attendeeCount}
              location={event.location}
              onClick={() => onEventClick(event)}
            />
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Marquee;