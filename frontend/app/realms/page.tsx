"use client";
import React, { useState, useMemo } from "react";
import { Search, Loader2, RefreshCw, Users, Calendar, Globe, Shield } from "lucide-react";
import Marquee from "@/components/Realms/Marquee";
import VerifierModal from "@/components/Realms/VerifierMondal";
import Event from "@/components/Realms/Realm";
import { useRealms } from "@/hooks/useRealm";

const EventList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch realms using the enhanced hook with requirements data
  const { realms, isLoading, error, refetch, totalRealms } = useRealms({
    includeRequirements: true // Get verification requirements
  });

  // Transform realm data to match the expected event format
  const transformedEvents = useMemo(() => {
    return realms.map((realm, index) => {
      const requirements = realm.requirements || {};
      
      // Format location based on coordinates
      const hasLocation = realm.latitude && realm.longitude && 
                          Number(realm.latitude) !== 0 && Number(realm.longitude) !== 0;
      
      // Determine gender requirement text
      let genderRequirement = "All genders welcome";
      if (requirements.requiresMaleOnly) {
        genderRequirement = "Male only";
      } else if (requirements.requiresFemaleOnly) {
        genderRequirement = "Female only";
      }

      // Format country restrictions
      let countryRestrictions = "Global";
      if (requirements.allowedCountries?.length > 0) {
        countryRestrictions = `${requirements.allowedCountries.join(", ")} only`;
      } else if (requirements.blockedCountries?.length > 0) {
        countryRestrictions = `Excluding ${requirements.blockedCountries.join(", ")}`;
      }

      // Create verification requirements summary
      const verificationSummary = [];
      if (Number(requirements.minimumAge || realm.minimumAge) > 0) {
        verificationSummary.push(`${Number(requirements.minimumAge || realm.minimumAge)}+`);
      }
      if (requirements.requiresMaleOnly || requirements.requiresFemaleOnly) {
        verificationSummary.push(genderRequirement);
      }
      if (requirements.allowedCountries?.length > 0 || requirements.blockedCountries?.length > 0) {
        verificationSummary.push(countryRestrictions);
      }

      return {
        id: index + 1,
        creator: realm.address,
        title: realm.title,
        description: realm.description || `Experience this verified realm with ${Number(realm.attendeeCount)} other participants.`,
        latitude: Number(realm.latitude) / 1000000, // Convert back from contract format
        longitude: Number(realm.longitude) / 1000000,
        ticketPrice: Number(realm.ticketPrice) / 1e18, // Convert from wei to ETH
        capacity: Number(realm.capacity),
        verseDate: Number(realm.realmDate),
        verificationConfigId: "0x" + realm.address.slice(2, 18),
        isOnline: !hasLocation,
        requiresMaleOnly: requirements.requiresMaleOnly || false,
        requiresFemaleOnly: requirements.requiresFemaleOnly || false,
        minimumAge: Number(requirements.minimumAge || realm.minimumAge || 0),
        allowedCountries: requirements.allowedCountries || [],
        blockedCountries: requirements.blockedCountries || [],
        requiredNationality: requirements.allowedCountries?.join(", ") || "",
        attendeeCount: Number(realm.attendeeCount),
        category: hasLocation ? "In-Person" : "Virtual",
        location: hasLocation ? 
          `${(Number(realm.latitude) / 1000000).toFixed(4)}, ${(Number(realm.longitude) / 1000000).toFixed(4)}` : 
          "Virtual",
        address: realm.address,
        
        // Enhanced fields for better display
        genderRequirement,
        countryRestrictions,
        verificationSummary: verificationSummary.length > 0 ? verificationSummary.join(" • ") : "Open access",
        hasVerificationRequirements: verificationSummary.length > 0,
        
        // Date formatting
        formattedDate: new Date(Number(realm.realmDate) * 1000).toLocaleDateString(),
        isUpcoming: Number(realm.realmDate) * 1000 > Date.now(),
        daysTillEvent: Math.ceil((Number(realm.realmDate) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)),
      };
    });
  }, [realms]);

  const featuredEvents = useMemo(() => {
    return transformedEvents
      .filter(event => event.isUpcoming) // Only show upcoming events
      .sort((a, b) => b.attendeeCount - a.attendeeCount)
      .slice(0, 4);
  }, [transformedEvents]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return transformedEvents;
    
    const query = searchQuery.toLowerCase();
    return transformedEvents.filter((event) =>
      [
        event.title,
        event.description,
        event.category,
        event.location,
        event.genderRequirement,
        event.countryRestrictions,
        event.verificationSummary
      ].some((field) => field.toLowerCase().includes(query))
    );
  }, [transformedEvents, searchQuery]);

  // Group events by verification requirements
  const eventsByCategory = useMemo(() => {
    const upcoming = filteredEvents.filter(e => e.isUpcoming);
    const verified = upcoming.filter(e => e.hasVerificationRequirements);
    const open = upcoming.filter(e => !e.hasVerificationRequirements);
    const past = filteredEvents.filter(e => !e.isUpcoming);
    
    return { upcoming, verified, open, past };
  }, [filteredEvents]);

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
          <p className="text-gray-500">Fetching verified realms from the blockchain...</p>
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
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
              Join verified metaverse and IRL experiences powered by Self Protocol
            </p>
            {totalRealms > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                  <Globe size={14} />
                  {totalRealms} realm{totalRealms !== 1 ? 's' : ''}
                </span>
                {eventsByCategory.verified.length > 0 && (
                  <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <Shield size={14} />
                    {eventsByCategory.verified.length} verified
                  </span>
                )}
                {eventsByCategory.upcoming.length > 0 && (
                  <span className="text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <Calendar size={14} />
                    {eventsByCategory.upcoming.length} upcoming
                  </span>
                )}
              </div>
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
              placeholder="Search realms, requirements, locations..."
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
            <p className="text-gray-500">Be the first to create a verified realm!</p>
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
                <p className="text-gray-400 text-sm mt-2">
                  Search by title, verification requirements, age, gender, or country restrictions
                </p>
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