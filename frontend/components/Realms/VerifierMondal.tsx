"use client";
import React, { useState, useEffect } from "react";
import { Users, Calendar, X, Shield, CheckCircle, Coins } from "lucide-react";
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation"; // Add this import

type VerifierModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  contractAddress: string;
};

const VerifierModal: React.FC<VerifierModalProps> = ({
  isOpen,
  onClose,
  event,
  contractAddress,
}) => {
  console.log("event : " + JSON.stringify(event));
  console.log("contract address : " + contractAddress);
  const [selfApp, setSelfApp] = useState<ReturnType<typeof SelfAppBuilder.prototype.build> | null>(null);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const [isJoining, setIsJoining] = useState(false); // Add loading state
  const { address, isConnected } = useAccount();
  const router = useRouter(); // Initialize router

  // Initialize Self App when wallet is connected
  useEffect(() => {
    if (!isOpen || !event || !isConnected || !address) {
      return;
    }

    const initializeSelfApp = async () => {
      try {
        const disclosures = {
          nationality: !!event.requiredNationality,
          gender: event.requiresMaleOnly || event.requiresFemaleOnly,
        };

        let userDefinedData = event.requiresMaleOnly
          ? "Male only"
          : event.requiresFemaleOnly
          ? "Female only"
          : "Verification";

        if (event.requiredNationality) {
          userDefinedData += ` - ${event.requiredNationality} only`;
        }
        const endpoint = contractAddress;
        const app = new SelfAppBuilder({
          endpoint: endpoint.toLowerCase(),
          endpointType: "staging_celo",
          userIdType: "hex",
          appName: event.title,
          scope: "konnect",
          userId: address,
          disclosures: {
            minimumAge: 18,
            excludedCountries: [],
            ofac: false,
            gender: true,
          },
          userDefinedData,
        }).build();

        setSelfApp(app);
      } catch (error) {
        console.error("Failed to initialize Self app:", error);
      }
    };

    initializeSelfApp();
  }, [isOpen, isConnected, address, event, contractAddress]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsVerificationComplete(false);
      setSelfApp(null);
      setIsJoining(false);
    }
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const handleSuccessfulVerification = () => {
    setIsVerificationComplete(true);
  };

  // Handle join button click with redirect
  const handleJoinEvent = async () => {
    setIsJoining(true);

    try {
      // You can add any payment logic here if needed
      // For example, if event.ticketPrice > 0, handle payment first

      // Validate contract address before redirecting
      if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        throw new Error("Invalid contract address format");
      }

      // Close modal first
      onClose();

      // Redirect to the game page
      router.push(`/${contractAddress}`);
    } catch (error) {
      console.error("Failed to join event:", error);
      alert("Failed to join game. Please try again.");
      setIsJoining(false);
    }
  };

  const verificationReqs = [
    { requirement: "Government ID", completed: isVerificationComplete },
    {
      requirement: "Age verification (18+)",
      completed: isVerificationComplete,
    },
    {
      requirement: "Gender verification",
      completed:
        isVerificationComplete &&
        (event.requiresMaleOnly || event.requiresFemaleOnly),
    },
    {
      requirement: "Nationality check",
      completed: isVerificationComplete && !!event.requiredNationality,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                isVerificationComplete ? "bg-green-400" : "bg-yellow-400"
              }`}
            ></div>
            <h2 className="text-xl font-semibold text-white">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-4 text-gray-400 text-sm mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(event.verseDate * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Users size={18} className="text-blue-400" />
                    <span>
                      {event.attendeeCount}/{event.capacity} + + address : +{" "}
                      {contractAddress}
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {event.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Shield size={20} className="text-yellow-400 mr-3" />
                  Verification Requirements
                </h3>
                <div className="space-y-3">
                  {verificationReqs.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10"
                    >
                      {req.completed ? (
                        <CheckCircle
                          size={18}
                          className="text-green-400 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-[18px] h-[18px] border-2 border-gray-500 rounded-full flex-shrink-0"></div>
                      )}
                      <span
                        className={`text-sm ${
                          req.completed ? "text-green-300" : "text-gray-300"
                        }`}
                      >
                        {req.requirement}
                      </span>
                      {req.completed && (
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full ml-auto">
                          Verified
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {(event.requiresMaleOnly ||
                  event.requiresFemaleOnly ||
                  event.requiredNationality) && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-red-300 font-medium mb-2">
                      Special Requirements:
                    </h4>
                    <ul className="text-red-200 text-sm space-y-1">
                      {event.requiresMaleOnly && <li>• Males only</li>}
                      {event.requiresFemaleOnly && <li>• Females only</li>}
                      {event.requiredNationality && (
                        <li>• {event.requiredNationality} nationals only</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-start space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Identity Verification
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {!isConnected
                    ? "Connect your wallet to verify"
                    : isVerificationComplete
                    ? "Verification complete!"
                    : "Scan with the Self app to verify"}
                </p>

                {!isConnected ? (
                  <div className="w-[200px] h-[200px] border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center bg-white/5">
                    <div className="text-center">
                      <Shield
                        size={48}
                        className="text-gray-500 mx-auto mb-2"
                      />
                      <p className="text-gray-500 text-sm">Connect Wallet</p>
                    </div>
                  </div>
                ) : selfApp ? (
                  <div className="bg-white p-4 rounded-xl">
                    <SelfQRcodeWrapper
                      selfApp={selfApp}
                      onError={() => {}}
                      onSuccess={handleSuccessfulVerification}
                    />
                  </div>
                ) : (
                  <div className="w-[200px] h-[200px] border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center bg-white/5">
                    <div className="text-center">
                      <Shield
                        size={48}
                        className="text-gray-500 mx-auto mb-2"
                      />
                      <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 w-full max-w-xs">
                {!isConnected ? (
                  <ConnectButton.Custom>
                    {({ openConnectModal, authenticationStatus, mounted }) => {
                      const ready =
                        mounted && authenticationStatus !== "loading";
                      return (
                        <button
                          onClick={openConnectModal}
                          disabled={!ready}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                        >
                          <Coins size={18} />
                          <span>Connect Wallet</span>
                        </button>
                      );
                    }}
                  </ConnectButton.Custom>
                ) : isVerificationComplete ? (
                  <button
                    onClick={handleJoinEvent}
                    disabled={isJoining}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <Coins size={18} />
                    <span>
                      {isJoining
                        ? "Joining..."
                        : event.ticketPrice > 0
                        ? `Join (${event.ticketPrice} ETH)`
                        : "Join Free"}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifierModal;
