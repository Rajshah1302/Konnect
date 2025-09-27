"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCreateRealm } from "@/hooks/useCreateRealm";
import { useAccount } from "wagmi";

const CreateRealmPage = () => {
  const {
    createRealm,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    realmAddress,
  } = useCreateRealm();

  const { isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    address: "",
    ticketPrice: "",
    capacity: "",
    realmDate: "",
    isOnline: false,
    genderRequirement: "all", // "all", "male", "female"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    const updatedFields = Object.keys(updates);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => {
        delete newErrors[field];
      });
      return newErrors;
    });
  };

  // Get user's current location for online events
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors({ location: "Geolocation is not supported by this browser" });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateFormData({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "An unknown error occurred";
            break;
        }
        setErrors({ location: errorMessage });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Auto-get location when switching to online
  useEffect(() => {
    if (formData.isOnline && !formData.latitude && !formData.longitude) {
      getCurrentLocation();
    }
  }, [formData.isOnline]);

  // Geocoding function (using OpenStreetMap Nominatim)
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=5`
      );
      const data = await response.json();

      return data.map((result) => ({
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
      }));
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.address.trim()) return;

    setIsSearching(true);
    setErrors({});

    try {
      const results = await geocodeAddress(formData.address);

      if (results.length > 0) {
        setSearchResults(results);
        // Auto-select first result if there's only one
        if (results.length === 1) {
          updateFormData({
            latitude: results[0].lat.toString(),
            longitude: results[0].lon.toString(),
          });
          setSearchResults([]);
        }
      } else {
        setErrors({ address: "No locations found for this address" });
      }
    } catch (error) {
      setErrors({ address: "Error searching for address" });
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    updateFormData({
      latitude: result.lat.toString(),
      longitude: result.lon.toString(),
      address: result.display_name,
    });
    setSearchResults([]);
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = "Required";
      if (!formData.description.trim()) newErrors.description = "Required";
    } else if (step === 2) {
      if (!formData.capacity || formData.capacity <= 0)
        newErrors.capacity = "Required";
      if (!formData.realmDate) newErrors.realmDate = "Required";
      if (!formData.isOnline) {
        if (!formData.latitude) newErrors.latitude = "Required";
        if (!formData.longitude) newErrors.longitude = "Required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 2)); // Changed from 3 to 2
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    if (!isConnected) {
      setSubmitStatus({
        type: "error",
        message: "Please connect your wallet first.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await createRealm(formData);
    } catch (error) {
      console.error("Error creating realm:", error);

      let errorMessage = "Failed to create realm. Please try again.";

      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected")
      ) {
        errorMessage = "Transaction was rejected by user.";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds to complete the transaction.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });
      setIsSubmitting(false);
    }
  };

  // Add these useEffect hooks to handle transaction states
  React.useEffect(() => {
    if (hash && !isConfirming && !isConfirmed) {
      setSubmitStatus({
        type: "loading",
        message: `Transaction submitted! Hash: ${hash}. Waiting for confirmation...`,
      });
    }
  }, [hash, isConfirming, isConfirmed]);

  React.useEffect(() => {
    if (isConfirming) {
      setSubmitStatus({
        type: "loading",
        message: "Transaction is being confirmed...",
      });
    }
  }, [isConfirming]);

  React.useEffect(() => {
    if (isConfirmed) {
      setSubmitStatus({
        type: "success",
        message: `Realm created successfully! ${
          realmAddress ? `Realm address: ${realmAddress}` : ""
        }`,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        latitude: "",
        longitude: "",
        address: "",
        ticketPrice: "",
        capacity: "",
        realmDate: "",
        isOnline: false,
        genderRequirement: "all",
      });
      setCurrentStep(1);
      setIsSubmitting(false);
    }
  }, [isConfirmed, realmAddress]);

  React.useEffect(() => {
    if (error) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Transaction failed",
      });
      setIsSubmitting(false);
    }
  }, [error]);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {[1, 2].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              step <= currentStep
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25"
                : "bg-white/5 text-gray-400 border border-white/10"
            }`}
          >
            {step}
          </div>
          {step < 2 && (
            <div
              className={`w-20 h-0.5 transition-all duration-300 ${
                step < currentStep
                  ? "bg-gradient-to-r from-blue-500 to-purple-500"
                  : "bg-white/10"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black py-16 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/2 to-purple-500/2 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 leading-tight">
            Create New Realm
          </h1>
          <p className="text-gray-400 text-lg font-light">
            Set up your exclusive realm with identity verification
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-8">
            <StepIndicator />

            {submitStatus && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 mb-8 border transition-all duration-300 ${
                  submitStatus.type === "success"
                    ? "bg-green-500/10 text-green-300 border-green-500/20"
                    : submitStatus.type === "loading"
                    ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                    : "bg-red-500/10 text-red-300 border-red-500/20"
                }`}
              >
                {submitStatus.type === "success" ? (
                  <CheckCircle size={20} />
                ) : submitStatus.type === "loading" ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <AlertCircle size={20} />
                )}
                {submitStatus.message}
              </div>
            )}

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    Basic Information
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Tell us about your realm
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="title"
                      className="text-sm font-medium text-gray-300"
                    >
                      Name *
                    </Label>
                  </div>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Web3 Developers Meetup"
                    className={`transition-all focus:ring-2 focus:ring-blue-500 bg-white/5 border-white/10 text-white placeholder-gray-400 ${
                      errors.title ? "border-red-500" : ""
                    }`}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-300"
                    >
                      Description *
                    </Label>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData({ description: e.target.value })
                    }
                    placeholder="Enter a detailed description of your realm..."
                    rows={4}
                    className={`transition-all focus:ring-2 focus:ring-blue-500 bg-white/5 border-white/10 text-white placeholder-gray-400 resize-none ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm">{errors.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Event Details & Gender Requirements */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    Event Details & Requirements
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Configure your realm settings and access requirements
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-neutral-400" />
                      <Label
                        htmlFor="realmDate"
                        className="text-sm font-medium text-gray-300"
                      >
                        Date *
                      </Label>
                    </div>
                    <Input
                      type="date"
                      id="realmDate"
                      name="realmDate"
                      value={formData.realmDate}
                      onChange={(e) =>
                        updateFormData({ realmDate: e.target.value })
                      }
                      min={getCurrentDate()}
                      className={`transition-all focus:ring-2 focus:ring-blue-500 bg-white/5 border-white/10 text-white ${
                        errors.realmDate ? "border-red-500" : ""
                      }`}
                    />
                    {errors.realmDate && (
                      <p className="text-red-500 text-sm">{errors.realmDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-neutral-400" />
                      <Label
                        htmlFor="capacity"
                        className="text-sm font-medium text-gray-300"
                      >
                        Capacity *
                      </Label>
                    </div>
                    <Input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={(e) =>
                        updateFormData({ capacity: e.target.value })
                      }
                      placeholder="50"
                      min="1"
                      className={`transition-all focus:ring-2 focus:ring-blue-500 bg-white/5 border-white/10 text-white placeholder-gray-400 ${
                        errors.capacity ? "border-red-500" : ""
                      }`}
                    />
                    {errors.capacity && (
                      <p className="text-red-500 text-sm">{errors.capacity}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-neutral-400" />
                    <Label
                      htmlFor="ticketPrice"
                      className="text-sm font-medium text-gray-300"
                    >
                      Ticket Price (CELO)
                    </Label>
                  </div>
                  <Input
                    type="number"
                    id="ticketPrice"
                    name="ticketPrice"
                    value={formData.ticketPrice}
                    onChange={(e) =>
                      updateFormData({ ticketPrice: e.target.value })
                    }
                    placeholder="0.01 (leave empty for free)"
                    step="0.001"
                    min="0"
                    className="transition-all focus:ring-2 focus:ring-blue-500 bg-white/5 border-white/10 text-white placeholder-gray-400"
                  />
                </div>

                {/* Enhanced Location Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="isOnline"
                      checked={formData.isOnline}
                      onCheckedChange={(checked) => {
                        updateFormData({
                          isOnline: checked,
                          latitude: "",
                          longitude: "",
                          address: "",
                        });
                        setSearchResults([]);
                        setErrors({});
                      }}
                      className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label
                      htmlFor="isOnline"
                      className="text-gray-300 flex items-center gap-2 cursor-pointer"
                    >
                      <Globe size={16} className="text-gray-400" />
                      Online realm
                    </Label>
                  </div>

                  {formData.isOnline ? (
                    // Online event - use current location
                    <div className="pl-8 border-l border-white/10 space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Navigation size={14} />
                        <span>
                          Using your current location for online event
                        </span>
                      </div>

                      {!formData.latitude && !formData.longitude && (
                        <Button
                          onClick={getCurrentLocation}
                          disabled={isGettingLocation}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isGettingLocation ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Getting location...
                            </>
                          ) : (
                            <>
                              <Navigation className="mr-2 h-4 w-4" />
                              Get Current Location
                            </>
                          )}
                        </Button>
                      )}

                      {(formData.latitude || formData.longitude) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-300">
                              Latitude
                            </Label>
                            <Input
                              value={formData.latitude}
                              readOnly
                              className="bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-300">
                              Longitude
                            </Label>
                            <Input
                              value={formData.longitude}
                              readOnly
                              className="bg-white/5 border-white/10 text-white"
                            />
                          </div>
                        </div>
                      )}

                      {errors.location && (
                        <p className="text-red-500 text-sm">
                          {errors.location}
                        </p>
                      )}
                    </div>
                  ) : (
                    // Offline event - address search
                    <div className="pl-8 border-l border-white/10 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-neutral-400" />
                          <Label className="text-sm font-medium text-gray-300">
                            Event Address *
                          </Label>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={formData.address}
                            onChange={(e) =>
                              updateFormData({ address: e.target.value })
                            }
                            placeholder="Enter address (e.g., 123 Main St, City, State)"
                            className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-400"
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleAddressSearch()
                            }
                          />
                          <Button
                            onClick={handleAddressSearch}
                            disabled={isSearching || !formData.address.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                          >
                            {isSearching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {errors.address && (
                          <p className="text-red-500 text-sm">
                            {errors.address}
                          </p>
                        )}
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-300">
                            Select Location:
                          </Label>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {searchResults.map((result, index) => (
                              <div
                                key={index}
                                onClick={() => selectSearchResult(result)}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors"
                              >
                                <p className="text-white text-sm">
                                  {result.display_name}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {result.lat.toFixed(6)},{" "}
                                  {result.lon.toFixed(6)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manual Coordinates (if needed) */}
                      {(formData.latitude || formData.longitude) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-300">
                              Latitude *
                            </Label>
                            <Input
                              type="number"
                              value={formData.latitude}
                              onChange={(e) =>
                                updateFormData({ latitude: e.target.value })
                              }
                              placeholder="37.7749"
                              step="0.000001"
                              className={`bg-white/5 border-white/10 text-white placeholder-gray-400 ${
                                errors.latitude ? "border-red-500" : ""
                              }`}
                            />
                            {errors.latitude && (
                              <p className="text-red-500 text-sm">
                                {errors.latitude}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-300">
                              Longitude *
                            </Label>
                            <Input
                              type="number"
                              value={formData.longitude}
                              onChange={(e) =>
                                updateFormData({ longitude: e.target.value })
                              }
                              placeholder="-122.4194"
                              step="0.000001"
                              className={`bg-white/5 border-white/10 text-white placeholder-gray-400 ${
                                errors.longitude ? "border-red-500" : ""
                              }`}
                            />
                            {errors.longitude && (
                              <p className="text-red-500 text-sm">
                                {errors.longitude}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gender Requirements Section - Added to Step 2 */}
                <div className="space-y-6 pt-6 border-t border-white/10">
                  <div>
                    <Label className="text-gray-300 font-medium mb-4 flex">
                      <Users className="h-4 w-4 text-neutral-400 mr-2" />
                      Gender Requirements
                    </Label>
                    <RadioGroup
                      value={formData.genderRequirement}
                      onValueChange={(value) =>
                        updateFormData({ genderRequirement: value })
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value="all"
                          id="all"
                          className="border-white/20 text-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <Label
                          htmlFor="all"
                          className="text-gray-300 cursor-pointer"
                        >
                          All genders welcome
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value="male"
                          id="male"
                          className="border-white/20 text-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <Label
                          htmlFor="male"
                          className="text-gray-300 cursor-pointer"
                        >
                          Male only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value="female"
                          id="female"
                          className="border-white/20 text-blue-500 data-[state=checked]:border-blue-500"
                        />
                        <Label
                          htmlFor="female"
                          className="text-gray-300 cursor-pointer"
                        >
                          Female only
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-10 mt-10 border-t border-white/10">
              <Button
                onClick={handleBack}
                disabled={currentStep === 1}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>

              {currentStep < 2 ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25"
                >
                  Next
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Realm"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            <div className="w-8 h-px bg-gradient-to-r from-white/20 via-white/40 to-white/20"></div>
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRealmPage;
