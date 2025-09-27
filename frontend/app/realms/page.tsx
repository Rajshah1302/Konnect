"use client";
import React, { useState, useMemo } from "react";
import { Search, Loader2, RefreshCw } from "lucide-react";
import Marquee from "@/components/Realms/Marquee";
import VerifierModal from "@/components/Realms/VerifierMondal";
import Event from "@/components/Realms/Realm";
import { useRealms } from "@/hooks/useRealm";

const EventList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch realms using the hook
  const { realms, isLoading, error, refetch, totalRealms } = useRealms();

  // Transform realm data to match the expected event format
  const transformedEvents = useMemo(() => {
    return realms.map((realm, index) => ({
      id: index + 1,
      creator: realm.address, // Using contract address as creator for now
      title: realm.title,
      description: `Experience this realm with ${Number(realm.attendeeCount)} other participants.`,
      latitude: 0, // These would need to be fetched separately if needed
      longitude: 0,
      ticketPrice: Number(realm.ticketPrice) / 1e18, // Convert from wei to ETH
      capacity: Number(realm.capacity),
      verseDate: Number(realm.realmDate),
      verificationConfigId: "0x" + realm.address.slice(2, 18), // Mock verification ID
      isOnline: true, // Assuming all realms are online for now
      requiresMaleOnly: false, // These would need separate contract calls to get
      requiresFemaleOnly: false,
      requiredNationality: "",
      attendeeCount: Number(realm.attendeeCount),
      category: realm.isOnline ? "Virtual" : "In-Person",
      location: realm.isOnline ? "Virtual" : "TBD",
      address: realm.address, // Keep the original address for reference
    }));
  }, [realms]);

  const featuredEvents = useMemo(() => {
    return transformedEvents
      .sort((a, b) => b.attendeeCount - a.attendeeCount)
      .slice(0, 4);
  }, [transformedEvents]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return transformedEvents;
    
    return transformedEvents.filter((event) =>
      [event.title, event.description, event.category, event.location].some(
        (field) => field.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [transformedEvents, searchQuery]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading && realms.length === 0) {
    return (
      <div className="min-h-screen bg-black py-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-400 animate-spin mx-auto mb-4" />
          <h3 className="text-xl text-gray-300 font-medium mb-2">
            Loading Realms
          </h3>
          <p className="text-gray-500">Fetching realms from the blockchain...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && realms.length === 0) {
    return (
      <div className="min-h-screen bg-black py-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw size={24} className="text-red-400" />
          </div>
          <h3 className="text-xl text-gray-300 font-medium mb-2">
            Failed to Load Realms
          </h3>
          <p className="text-gray-500 mb-4">
            {error?.message || "Unable to fetch realms from the blockchain"}
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
              Discover Realms
            </h1>
            {isLoading && (
              <Loader2 size={24} className="text-blue-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
              Join verified metaverse and IRL experiences powered by Self Protocol
            </p>
            {totalRealms > 0 && (
              <span className="text-blue-400 text-sm bg-blue-500/10 px-3 py-1 rounded-full">
                {totalRealms} realm{totalRealms !== 1 ? 's' : ''} available
              </span>
            )}
          </div>
        </div>

        {featuredEvents.length > 0 && (
          <Marquee events={featuredEvents} onEventClick={handleEventClick} />
        )}

        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search realms, categories, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/8 transition-all duration-300"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {error && (
                <button
                  onClick={handleRefresh}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Retry loading realms"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              <div className="w-2 h-2 bg-blue-400/50 rounded-full animate-pulse"></div>
            </div>
          </div>
          {searchQuery && (
            <div className="mt-4 text-center">
              <span className="text-gray-400 text-sm">
                Found {filteredEvents.length} realm
                {filteredEvents.length !== 1 ? "s" : ""} matching "{searchQuery}"
              </span>
            </div>
          )}
        </div>

        {transformedEvents.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-500" />
            </div>
            <h3 className="text-xl text-gray-300 font-medium mb-2">
              No realms available
            </h3>
            <p className="text-gray-500">Be the first to create a realm!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredEvents.map((event) => (
                <Event
                  key={event.address || event.id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>

            {filteredEvents.length === 0 && searchQuery && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-500" />
                </div>
                <h3 className="text-xl text-gray-300 font-medium mb-2">
                  No realms found
                </h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </>
        )}
      </div>

      <VerifierModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        event={selectedEvent}
        contractAddress={selectedEvent?.address}
      />
    </div>
  );
};

export default EventList;