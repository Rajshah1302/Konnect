"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import MockLoadingWindow from "../loader"

import MapComponent from "./map"

// Icons, UI, Assets
import NexusLogo from "@/assets/nexusLogo.png";
import { useRealms } from "@/hooks/useRealm";
import VerifierModal from "../Realms/VerifierMondal";

// Define the Realm type based on the useRealms hook
interface Realm {
  address: `0x${string}`;
  title: string;
  ticketPrice: bigint;
  capacity: bigint;
  realmDate: bigint;
  attendeeCount: bigint;
  // Add additional properties for map display
  propertyLatitude?: string;
  propertyLongitude?: string;
  description?: string;
}

// Function to generate coordinates near the user's location
const generateNearbyCoordinates = (userLat: number, userLng: number, count: number) => {
  const coordinates = [];
  const radiusKm = 0.3; // 1km radius around user
  
  for (let i = 0; i < count; i++) {
    // Generate random angle and distance
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5; // Distribute evenly with some randomness
    const distance = Math.random() * radiusKm; // Random distance within radius
    
    // Convert to lat/lng offset
    const latOffset = (distance / 111) * Math.cos(angle); // 1 degree lat ≈ 111km
    const lngOffset = (distance / (111 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angle);
    
    coordinates.push({
      lat: (userLat + latOffset).toString(),
      lng: (userLng + lngOffset).toString()
    });
  }
  
  return coordinates;
};

export default function PlayableMap() {
  const router = useRouter();
  const { address: userAddress } = useAccount();

  // Use the realms hook instead of mock data
  const { realms, isLoading, error, refetch } = useRealms({
    limit: 50,
    autoFetch: true,
    enabled: true
  });

  // Modal state for showing the VerifierModal
  const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Current user location (for the map)
  const [currentUser, setCurrentUser] = useState({
    id: "current",
    latitude: 0,
    longitude: 0,
    name: "You",
    avatarUrl: "📍",
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentUser((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      },
      (error) => {
        console.error("Error retrieving geolocation:", error);
        // Set default location if geolocation fails (New York City)
        setCurrentUser((prev) => ({
          ...prev,
          latitude: 40.7128,
          longitude: -74.0060,
        }));
      }
    );
  }, []);

  // Convert realms into marker format for the MapComponent
  const markers = useMemo(() => {
    if (realms.length === 0 || (currentUser.latitude === 0 && currentUser.longitude === 0)) {
      return [];
    }

    // Generate coordinates near the user's location
    const nearbyCoordinates = generateNearbyCoordinates(
      currentUser.latitude, 
      currentUser.longitude, 
      realms.length
    );
    
    return realms.map((realm, index) => {
      const coordinates = nearbyCoordinates[index];
      
      return {
        id: realm.address,
        name: realm.title,
        latitude: parseFloat(coordinates.lat),
        longitude: parseFloat(coordinates.lng),
        symbol: "REALM",
        logoUrl: NexusLogo.src,
        backgroundColor: "#8A2BE2",
      };
    });
  }, [realms, currentUser.latitude, currentUser.longitude]);

  // When a marker is clicked, open the VerifierModal with realm details
  const handleMarkerClick = useCallback(
    (markerId: string) => {
      const found = realms.find((r) => r.address === markerId);
      if (found && currentUser.latitude !== 0 && currentUser.longitude !== 0) {
        // Generate the same coordinates for consistency
        const nearbyCoordinates = generateNearbyCoordinates(
          currentUser.latitude, 
          currentUser.longitude, 
          realms.length
        );
        const realmIndex = realms.findIndex((r) => r.address === markerId);
        const coordinates = nearbyCoordinates[realmIndex];
        
        const enrichedRealm = {
          ...found,
          propertyLatitude: coordinates.lat,
          propertyLongitude: coordinates.lng,
          description: `Join this exclusive realm event with ${Number(found.capacity)} total capacity. ${Number(found.attendeeCount)} attendees already confirmed.`,
        };
        
        setSelectedRealm(enrichedRealm);
        setIsModalOpen(true);
      }
    },
    [realms, currentUser.latitude, currentUser.longitude]
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRealm(null);
  }, []);

  // Props for the MapComponent
  const mapProps = useMemo(
    () => ({
      tokens: markers,
      currentUser,
      onTokenClick: (token: { id: string }) => handleMarkerClick(token.id),
    }),
    [markers, currentUser, handleMarkerClick]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <MockLoadingWindow/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-red-500 space-y-4">
        <p>Failed to load realms: {error.message}</p>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Convert realm data for the VerifierModal
  const modalEvent = selectedRealm ? {
    title: selectedRealm.title,
    verseDate: Number(selectedRealm.realmDate),
    capacity: Number(selectedRealm.capacity),
    attendeeCount: Number(selectedRealm.attendeeCount),
    ticketPrice: Number(selectedRealm.ticketPrice),
    description: selectedRealm.description || `Join this exclusive realm event: ${selectedRealm.title}`,
    // Add default verification requirements (you can modify these based on your realm contract)
    requiredNationality: null,
    requiresMaleOnly: false,
    requiresFemaleOnly: false,
  } : null;

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <MapComponent {...mapProps} />
      </main>

      {/* VerifierModal instead of the custom Dialog */}
      {selectedRealm && modalEvent && (
        <VerifierModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          event={modalEvent}
          contractAddress={selectedRealm.address}
        />
      )}
    </>
  );
}