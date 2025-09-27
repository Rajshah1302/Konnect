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

  const createRealm = async (formData: { realmDate: any; isOnline: any; latitude: string; longitude: string; ticketPrice: { toString: () => string; }; title: any; description: any; capacity: string; verificationConfigId: any; genderRequirement: string; requiredNationality: any; }) => {
    if (!isConnected) {
      throw new Error("Please connect your wallet first");
    }

    // Prepare contract parameters
    const dateTime = new Date(`${formData.realmDate}T12:00:00`);
    const realmTimestamp = BigInt(Math.floor(dateTime.getTime() / 1000));

    // Convert coordinates to int256 (multiply by 1e6 for precision)
    const latitude = formData.isOnline
      ? 0n
      : BigInt(Math.floor(parseFloat(formData.latitude) * 1000000));
    const longitude = formData.isOnline
      ? 0n
      : BigInt(Math.floor(parseFloat(formData.longitude) * 1000000));

    // Convert ticket price to wei (assuming it's in ETH)
    const ticketPriceWei = formData.ticketPrice
      ? parseEther(formData.ticketPrice.toString())
      : 0n;

    const args = [
      formData.title,
      formData.description,
      latitude,
      longitude,
      ticketPriceWei,
      BigInt(parseInt(formData.capacity)),
      realmTimestamp,
      formData.verificationConfigId,
      formData.isOnline,
      formData.genderRequirement === "male",
      formData.genderRequirement === "female",
      formData.requiredNationality || "",
    ];

    console.log("Creating realm with parameters:", args);

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
