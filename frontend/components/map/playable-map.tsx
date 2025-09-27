"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import MockLoadingWindow from "../loader"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import MapComponent from "./map"

// Icons, UI, Assets
import { X } from "lucide-react";
import NexusLogo from "@/assets/nexusLogo.png";
import { Button } from "@/components/ui/button";

// Define the RentalProperty type based on your contracts
interface RentalProperty {
  address: `0x${string}`;
  propertyName: string;
  propertyLatitude: string;
  propertyLongitude: string;
  propertyDescription: string;
  rentalMode: number; // 0 for monthly, 1 for daily
  offeredPrice: string; // using the returned value from basePrice
}

// Mock data for development
const MOCK_RENTAL_PROPERTIES: RentalProperty[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    propertyName: "Luxury Downtown Apartment",
    propertyLatitude: "40.7128",
    propertyLongitude: "-74.0060",
    propertyDescription: "Beautiful 2-bedroom apartment in the heart of downtown with stunning city views and modern amenities.",
    rentalMode: 0, // Monthly
    offeredPrice: "2500"
  },
  {
    address: "0x2345678901234567890123456789012345678901",
    propertyName: "Cozy Beach House",
    propertyLatitude: "25.7617",
    propertyLongitude: "-80.1918",
    propertyDescription: "Charming beachfront property perfect for weekend getaways. Features ocean views and private beach access.",
    rentalMode: 1, // Daily
    offeredPrice: "350"
  },
  {
    address: "0x3456789012345678901234567890123456789012",
    propertyName: "Mountain Cabin Retreat",
    propertyLatitude: "39.7392",
    propertyLongitude: "-104.9903",
    propertyDescription: "Rustic cabin nestled in the mountains, ideal for nature lovers. Includes hiking trails and fireplace.",
    rentalMode: 1, // Daily
    offeredPrice: "200"
  },
  {
    address: "0x4567890123456789012345678901234567890123",
    propertyName: "Modern City Loft",
    propertyLatitude: "34.0522",
    propertyLongitude: "-118.2437",
    propertyDescription: "Stylish loft in trendy neighborhood with exposed brick walls and high ceilings. Close to restaurants and nightlife.",
    rentalMode: 0, // Monthly
    offeredPrice: "3200"
  },
  {
    address: "0x5678901234567890123456789012345678901234",
    propertyName: "Suburban Family Home",
    propertyLatitude: "41.8781",
    propertyLongitude: "-87.6298",
    propertyDescription: "Spacious 4-bedroom home in quiet neighborhood. Perfect for families with large backyard and garage.",
    rentalMode: 0, // Monthly
    offeredPrice: "2800"
  },
  {
    address: "0x6789012345678901234567890123456789012345",
    propertyName: "Historic Townhouse",
    propertyLatitude: "42.3601",
    propertyLongitude: "-71.0589",
    propertyDescription: "Beautifully restored Victorian townhouse with original hardwood floors and period details.",
    rentalMode: 0, // Monthly
    offeredPrice: "4500"
  }
];

export default function PlayableMap() {
  const router = useRouter();
  const { address: userAddress } = useAccount();

  const [rentalProperties, setRentalProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state for showing a selected property details
  const [selectedProperty, setSelectedProperty] = useState<RentalProperty | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Current user location (for the map)
  const [currentUser, setCurrentUser] = useState({
    id: "current",
    latitude: 0,
    longitude: 0,
    name: "You",
    avatarUrl: "📍",
  });

  // Mock function to simulate fetching rental properties
  const fetchRentalProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Use mock data instead of blockchain calls
      setRentalProperties(MOCK_RENTAL_PROPERTIES);
      
    } catch (err) {
      console.error("Error fetching properties:", err);
      setError("Failed to fetch properties. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch mock data, regardless of userAddress for demo purposes
    fetchRentalProperties();
  }, []);

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

  // Convert rental properties into marker format for the MapComponent
  const markers = useMemo(() => {
    return rentalProperties.map((property) => ({
      id: property.address,
      name: property.propertyName,
      latitude: parseFloat(property.propertyLatitude),
      longitude: parseFloat(property.propertyLongitude),
      symbol: "RENT",
      logoUrl: NexusLogo.src,
      backgroundColor: "#8A2BE2",
    }));
  }, [rentalProperties]);

  // When a marker is clicked, open the modal with property details
  const handleMarkerClick = useCallback(
    (markerId: string) => {
      const found = rentalProperties.find((p) => p.address === markerId);
      if (found) {
        setSelectedProperty(found);
        setIsModalOpen(true);
      }
    },
    [rentalProperties]
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProperty(null);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <MockLoadingWindow/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500">
        {error}
      </div>
    );
  }

  // Redirect logic for placing a bid or viewing further details
  const handlePlaceBid = () => {
    router.push("/bid");
  };

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <MapComponent {...mapProps} />
      </main>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleModalClose()}
      >
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40" />

            {/* Modal Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <DialogContent
                className="
                  relative 
                  bg-[#1a1a1a] 
                  text-white 
                  border 
                  border-[#333] 
                  rounded-lg 
                  shadow-md 
                  p-6 
                  max-w-sm 
                  w-full 
                  mx-4
                "
              >
                <DialogClose className="absolute top-4 right-4 text-gray-400 hover:text-gray-200">
                  <X className="w-5 h-5" />
                </DialogClose>

                {selectedProperty && (
                  <>
                    <DialogTitle className="text-xl font-bold text-center mb-4">
                      {selectedProperty.propertyName}
                    </DialogTitle>

                    <div className="flex justify-center mb-4">
                      <img
                        src={NexusLogo.src}
                        alt="Property Logo"
                        className="w-14 h-14 object-contain"
                      />
                    </div>

                    <div className="flex justify-center mb-2">
                      <span className="inline-block bg-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                        {selectedProperty.rentalMode === 0
                          ? "Monthly Rental"
                          : "Daily Rental"}
                      </span>
                    </div>

                    <div className="text-center text-sm text-gray-300 space-y-2 mb-4">
                      <p>{selectedProperty.propertyDescription}</p>
                    </div>

                    <div className="flex items-center justify-center text-base text-gray-100 mb-4">
                      <span className="mr-2">Price:</span>
                      <span>{selectedProperty.offeredPrice} $APT</span>
                    </div>

                    <Button
                      onClick={handlePlaceBid}
                      className="
                        w-full 
                        bg-blue-600 
                        hover:bg-blue-500 
                        text-white 
                        font-semibold 
                        py-2 
                        rounded-md 
                        flex 
                        items-center 
                        justify-center 
                        transition 
                        focus:outline-none 
                        focus:ring-2 
                        focus:ring-blue-400 
                        relative
                      "
                    >
                      Place Bid
                      <span className="absolute inset-0 rounded-md ring-2 ring-transparent group-hover:ring-blue-400 transition"></span>
                    </Button>
                  </>
                )}
              </DialogContent>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}