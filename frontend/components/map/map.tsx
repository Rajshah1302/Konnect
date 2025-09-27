"use client";

import mapboxgl from "mapbox-gl";
import { useRef, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { createTokenMarker } from "@/utlis/markers"; 
import { Token } from "@/types/token";
import { User } from "@/types/user";

interface MapComponentProps {
  tokens: Token[];
  currentUser: User;
  onTokenClick?: (token: Token) => void;
}

export default function MapComponent({
  tokens,
  currentUser,
  onTokenClick,
}: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const currentUserMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const tokenMarkersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      console.error("Mapbox token is required");
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current!,
        zoom: 18,
        pitch: 60,
        bearing: 0,
        attributionControl: false,
        projection: "globe",
        logoPosition: "top-left",
      });
      mapRef.current.setConfigProperty("basemap", "lightPreset", "night");

      // Create current user marker with emoji
      const currentUserElement = document.createElement("div");
      currentUserElement.innerText = "📍"; // Use emoji for current location marker
      currentUserElement.style.fontSize = "24px";
      currentUserElement.style.color = "#FF0000"; // Optional: Add a color

      currentUserMarkerRef.current = new mapboxgl.Marker({
        element: currentUserElement,
        anchor: "center",
      })
        .setLngLat([currentUser.longitude, currentUser.latitude])
        .addTo(mapRef.current!);

      // Create token markers with NexusLogo and titles
      tokens.forEach((token) => {
        // Create container for marker and title
        const markerContainer = document.createElement("div");
        markerContainer.style.display = "flex";
        markerContainer.style.flexDirection = "column";
        markerContainer.style.alignItems = "center";
        markerContainer.style.cursor = "pointer";

        // Create title element
        const titleElement = document.createElement("div");
        titleElement.textContent = token.name;
        titleElement.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        titleElement.style.color = "white";
        titleElement.style.padding = "4px 8px";
        titleElement.style.borderRadius = "4px";
        titleElement.style.fontSize = "12px";
        titleElement.style.fontWeight = "bold";
        titleElement.style.textAlign = "center";
        titleElement.style.whiteSpace = "nowrap";
        titleElement.style.marginBottom = "4px";
        titleElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        titleElement.style.border = "1px solid rgba(255,255,255,0.2)";

        // Create the actual token marker
        const tokenElement = createTokenMarker({
          ...token,
          logoUrl: "/assets/nexuslogo.png", // Replace with NexusLogo
        });

        // Append title and marker to container
        markerContainer.appendChild(titleElement);
        markerContainer.appendChild(tokenElement);

        if (onTokenClick) {
          markerContainer.addEventListener("click", () => onTokenClick(token));
        }

        const marker = new mapboxgl.Marker({
          element: markerContainer,
          anchor: "bottom",
        })
          .setLngLat([token.longitude, token.latitude])
          .addTo(mapRef.current!);

        tokenMarkersRef.current.push(marker);
      });
    }

    // Get and watch current user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];

          mapRef.current?.flyTo({
            center: newLocation,
            zoom: 16,
            essential: true,
          });

          currentUserMarkerRef.current
            ?.setLngLat(newLocation)
            .addTo(mapRef.current!);
        },
        (error) => console.error("Error getting location:", error)
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];

          if (currentUserMarkerRef.current) {
            currentUserMarkerRef.current.setLngLat(newLocation);
          }

          mapRef.current?.easeTo({
            center: newLocation,
            duration: 1000,
          });
        },
        (error) => console.error("Error watching position:", error),
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        currentUserMarkerRef.current?.remove();
        tokenMarkersRef.current.forEach((marker) => marker.remove());
        tokenMarkersRef.current = [];
      };
    }
  }, [tokens, currentUser, onTokenClick]);

  return (
    <main className="relative w-screen h-screen overflow-hidden dark-map">
      <style jsx global>{`
        .mapboxgl-control-container {
          display: none !important;
        }
        .mapboxgl-canvas {
          cursor: default !important;
        }
      `}</style>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </main>
  );
}