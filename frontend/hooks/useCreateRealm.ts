import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseEther, decodeEventLog } from "viem";
import {
  REALM_FACTORY_ABI,
  REALM_FACTORY_ADDRESS,
} from "@/utlis/contracts/RealmFactory.sol/RealmFactory";

export const useCreateRealm = () => {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const createRealm = async (formData) => {
    if (!isConnected) {
      throw new Error("Please connect your wallet first");
    }

    // Prepare contract parameters according to the updated contract signature:
    // createRealm(
    //   string memory title,
    //   string memory description,
    //   int256 latitude,
    //   int256 longitude,
    //   uint256 ticketPrice,
    //   uint256 capacity,
    //   uint256 realmDate,
    //   bool requiresMaleOnly,
    //   bool requiresFemaleOnly,
    //   uint256 minimumAge,
    //   string[] memory allowedCountries,
    //   string[] memory blockedCountries
    // )

    // Prepare date
    const dateTime = new Date(`${formData.realmDate}T12:00:00`);
    const realmTimestamp = BigInt(Math.floor(dateTime.getTime() / 1000));

    // Convert coordinates to int256 (multiply by 1e6 for precision)
    // Handle both online and offline events
    let latitude, longitude;
    
    if (formData.isOnline || !formData.latitude || !formData.longitude) {
      // For online events or missing coordinates, use 0
      latitude = 0n;
      longitude = 0n;
    } else {
      // Convert to int256 with 6 decimal precision
      latitude = BigInt(Math.floor(parseFloat(formData.latitude) * 1000000));
      longitude = BigInt(Math.floor(parseFloat(formData.longitude) * 1000000));
    }

    // Convert ticket price to wei (assuming it's in CELO)
    const ticketPriceWei = formData.ticketPrice
      ? parseEther(formData.ticketPrice.toString())
      : 0n;

    // Convert capacity to BigInt
    const capacity = BigInt(parseInt(formData.capacity));

    // Handle gender requirements
    const requiresMaleOnly = formData.genderRequirement === "male";
    const requiresFemaleOnly = formData.genderRequirement === "female";

    // Handle minimum age (default to 0 if not specified)
    const minimumAge = formData.minimumAge ? BigInt(parseInt(formData.minimumAge)) : 0n;

    // Handle country restrictions
    const allowedCountries = formData.allowedCountries || [];
    const blockedCountries = formData.blockedCountries || [];

    // Validate country arrays
    const processedAllowedCountries = Array.isArray(allowedCountries) 
      ? allowedCountries.filter(country => country && country.trim() !== '')
      : [];
    
    const processedBlockedCountries = Array.isArray(blockedCountries) 
      ? blockedCountries.filter(country => country && country.trim() !== '')
      : [];

    const args = [
      formData.title,
      formData.description,
      latitude,
      longitude,
      ticketPriceWei,
      capacity,
      realmTimestamp,
      requiresMaleOnly,
      requiresFemaleOnly,
      minimumAge,
      processedAllowedCountries,
      processedBlockedCountries,
    ];

    console.log("Creating realm with parameters:", {
      title: formData.title,
      description: formData.description,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      ticketPrice: ticketPriceWei.toString(),
      capacity: capacity.toString(),
      realmDate: realmTimestamp.toString(),
      requiresMaleOnly,
      requiresFemaleOnly,
      minimumAge: minimumAge.toString(),
      allowedCountries: processedAllowedCountries,
      blockedCountries: processedBlockedCountries,
    });

    return writeContract({
      address: REALM_FACTORY_ADDRESS,
      abi: REALM_FACTORY_ABI,
      functionName: "createRealm",
      args,
    });
  };

  // Extract realm address from transaction receipt
  const getRealmAddress = () => {
    if (!receipt?.logs) return null;

    try {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === REALM_FACTORY_ADDRESS.toLowerCase()) {
          const decoded = decodeEventLog({
            abi: REALM_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "RealmCreated") {
            return decoded.args.realmContract;
          }
        }
      }
    } catch (error) {
      console.error("Error parsing logs:", error);
    }

    return null;
  };

  return {
    createRealm,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    receipt,
    realmAddress: getRealmAddress(),
  };
};