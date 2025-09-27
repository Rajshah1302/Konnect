"use client";
import React from "react";
import { Users } from "lucide-react";

const Event = ({ event, onClick }) => (
  <div
    className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/8 hover:border-white/20 transition-all duration-500 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
    onClick={onClick}
  >
    <h3 className="text-xl line-clamp-1 font-medium text-white mb-3 leading-tight">
      {event.title}
    </h3>
    <p className="text-gray-400 mb-6 text-sm leading-relaxed line-clamp-2 font-light">
      {event.description}
    </p>

    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 text-gray-300">
        <Users size={16} className="text-gray-400" />
        <span className="text-sm font-light">
          {event.attendeeCount}/{event.capacity}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {event.ticketPrice > 0 ? (
          <span className="text-yellow-400 text-sm font-medium">
            {event.ticketPrice} ETH
          </span>
        ) : (
          <span className="text-green-400 text-sm font-medium">Free</span>
        )}
        <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400/50 to-transparent rounded-full group-hover:from-blue-400 transition-all duration-300"></div>
      </div>
    </div>
  </div>
);

export default Event;
