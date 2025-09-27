import { REALM_FACTORY_ADDRESS, REALM_FACTORY_ABI } from '@/utlis/contracts/RealmFactory.sol/RealmFactory';
import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';

export const useRealms = (options = {}) => {
  const { 
    limit = 50, // How many realms to fetch per batch
    autoFetch = true, // Whether to automatically start fetching
    enabled = true, // Whether the hook is enabled
    includeRequirements = false // Whether to fetch requirements data
  } = options;

  const [realms, setRealms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Get total number of realms
  const { 
    data: totalRealms, 
    isLoading: isLoadingTotal,
    error: totalError 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getTotalRealms',
    enabled: enabled && autoFetch,
  });

  // Get realm addresses in batches
  const { 
    data: realmAddresses, 
    isLoading: isLoadingAddresses,
    error: addressesError,
    refetch: refetchAddresses 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getRealms',
    args: [0, totalRealms || 0], // Start from 0, get all realms
    enabled: enabled && autoFetch && !!totalRealms,
  });

  // Get realm details
  const { 
    data: realmDetails, 
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getRealmsDetails',
    args: [realmAddresses || []],
    enabled: enabled && autoFetch && !!realmAddresses && realmAddresses.length > 0,
  });

  // Get realm requirements (optional)
  const { 
    data: realmRequirements, 
    isLoading: isLoadingRequirements,
    error: requirementsError,
    refetch: refetchRequirements 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getRealmsRequirements',
    args: [realmAddresses || []],
    enabled: enabled && autoFetch && includeRequirements && !!realmAddresses && realmAddresses.length > 0,
  });

  // Combine addresses with details and requirements
  useEffect(() => {
    if (realmAddresses && realmDetails) {
      // Contract returns: titles, ticketPrices, capacities, realmDates, attendeeCounts, minimumAges
      const [titles, ticketPrices, capacities, realmDates, attendeeCounts, minimumAges] = realmDetails;
      
      let combinedRealms = realmAddresses.map((address, index) => ({
        address,
        title: titles[index] || '',
        ticketPrice: ticketPrices[index] || 0n,
        capacity: capacities[index] || 0n,
        realmDate: realmDates[index] || 0n,
        attendeeCount: attendeeCounts[index] || 0n,
        minimumAge: minimumAges[index] || 0n,
      }));

      // Add requirements if available
      if (includeRequirements && realmRequirements) {
        const [requiresMaleOnly, requiresFemaleOnly, reqMinimumAges, allowedCountries, blockedCountries] = realmRequirements;
        
        combinedRealms = combinedRealms.map((realm, index) => ({
          ...realm,
          requirements: {
            requiresMaleOnly: requiresMaleOnly[index] || false,
            requiresFemaleOnly: requiresFemaleOnly[index] || false,
            minimumAge: reqMinimumAges[index] || 0n,
            allowedCountries: allowedCountries[index] || [],
            blockedCountries: blockedCountries[index] || [],
          }
        }));
      }

      setRealms(combinedRealms);
      setHasMore(false); // We fetched all realms
      setError(null);
    }
  }, [realmAddresses, realmDetails, realmRequirements, includeRequirements]);

  // Handle loading states
  useEffect(() => {
    const loading = isLoadingTotal || isLoadingAddresses || isLoadingDetails || 
                   (includeRequirements && isLoadingRequirements);
    setIsLoading(loading);
  }, [isLoadingTotal, isLoadingAddresses, isLoadingDetails, isLoadingRequirements, includeRequirements]);

  // Handle errors
  useEffect(() => {
    const combinedError = totalError || addressesError || detailsError || 
                         (includeRequirements && requirementsError);
    setError(combinedError);
  }, [totalError, addressesError, detailsError, requirementsError, includeRequirements]);

  // Manual refetch function
  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await refetchAddresses();
      await refetchDetails();
      if (includeRequirements) {
        await refetchRequirements();
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load more function for pagination (if you want to implement lazy loading)
  const loadMore = async (start = realms.length) => {
    if (!totalRealms || start >= Number(totalRealms)) {
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // This would require separate contract calls for pagination
      // For now, we're fetching all realms at once
      console.warn('Pagination not implemented - all realms are fetched at once');
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    realms,
    isLoading,
    error,
    hasMore,
    totalRealms: totalRealms ? Number(totalRealms) : 0,
    refetch,
    loadMore,
  };
};

// Alternative hook for fetching specific creator's realms
export const useCreatorRealms = (creatorAddress, options = {}) => {
  const { enabled = true, autoFetch = true, includeRequirements = false } = options;

  const { 
    data: creatorRealmAddresses, 
    isLoading: isLoadingAddresses,
    error: addressesError,
    refetch: refetchAddresses 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getCreatorRealms',
    args: [creatorAddress],
    enabled: enabled && autoFetch && !!creatorAddress,
  });

  const { 
    data: realmDetails, 
    isLoading: isLoadingDetails,
    error: detailsError,
    refetch: refetchDetails 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getRealmsDetails',
    args: [creatorRealmAddresses || []],
    enabled: enabled && autoFetch && !!creatorRealmAddresses && creatorRealmAddresses.length > 0,
  });

  const { 
    data: realmRequirements, 
    isLoading: isLoadingRequirements,
    error: requirementsError,
    refetch: refetchRequirements 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getRealmsRequirements',
    args: [creatorRealmAddresses || []],
    enabled: enabled && autoFetch && includeRequirements && !!creatorRealmAddresses && creatorRealmAddresses.length > 0,
  });

  const [realms, setRealms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (creatorRealmAddresses && realmDetails) {
      // Contract returns: titles, ticketPrices, capacities, realmDates, attendeeCounts, minimumAges
      const [titles, ticketPrices, capacities, realmDates, attendeeCounts, minimumAges] = realmDetails;
      
      let combinedRealms = creatorRealmAddresses.map((address, index) => ({
        address,
        title: titles[index] || '',
        ticketPrice: ticketPrices[index] || 0n,
        capacity: capacities[index] || 0n,
        realmDate: realmDates[index] || 0n,
        attendeeCount: attendeeCounts[index] || 0n,
        minimumAge: minimumAges[index] || 0n,
      }));

      // Add requirements if available
      if (includeRequirements && realmRequirements) {
        const [requiresMaleOnly, requiresFemaleOnly, reqMinimumAges, allowedCountries, blockedCountries] = realmRequirements;
        
        combinedRealms = combinedRealms.map((realm, index) => ({
          ...realm,
          requirements: {
            requiresMaleOnly: requiresMaleOnly[index] || false,
            requiresFemaleOnly: requiresFemaleOnly[index] || false,
            minimumAge: reqMinimumAges[index] || 0n,
            allowedCountries: allowedCountries[index] || [],
            blockedCountries: blockedCountries[index] || [],
          }
        }));
      }

      setRealms(combinedRealms);
      setError(null);
    }
  }, [creatorRealmAddresses, realmDetails, realmRequirements, includeRequirements]);

  useEffect(() => {
    const loading = isLoadingAddresses || isLoadingDetails || 
                   (includeRequirements && isLoadingRequirements);
    setIsLoading(loading);
  }, [isLoadingAddresses, isLoadingDetails, isLoadingRequirements, includeRequirements]);

  useEffect(() => {
    const combinedError = addressesError || detailsError || 
                         (includeRequirements && requirementsError);
    setError(combinedError);
  }, [addressesError, detailsError, requirementsError, includeRequirements]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await refetchAddresses();
      await refetchDetails();
      if (includeRequirements) {
        await refetchRequirements();
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    realms,
    isLoading,
    error,
    refetch,
  };
};

// Hook specifically for getting realm requirements
export const useRealmRequirements = (realmAddresses, options = {}) => {
  const { enabled = true, autoFetch = true } = options;

  const { 
    data: requirements, 
    isLoading,
    error,
    refetch 
  } = useReadContract({
    address: REALM_FACTORY_ADDRESS,
    abi: REALM_FACTORY_ABI,
    functionName: 'getRealmsRequirements',
    args: [realmAddresses || []],
    enabled: enabled && autoFetch && !!realmAddresses && realmAddresses.length > 0,
  });

  const [formattedRequirements, setFormattedRequirements] = useState([]);

  useEffect(() => {
    if (requirements && realmAddresses) {
      const [requiresMaleOnly, requiresFemaleOnly, minimumAges, allowedCountries, blockedCountries] = requirements;
      
      const formatted = realmAddresses.map((address, index) => ({
        address,
        requiresMaleOnly: requiresMaleOnly[index] || false,
        requiresFemaleOnly: requiresFemaleOnly[index] || false,
        minimumAge: minimumAges[index] || 0n,
        allowedCountries: allowedCountries[index] || [],
        blockedCountries: blockedCountries[index] || [],
      }));

      setFormattedRequirements(formatted);
    }
  }, [requirements, realmAddresses]);

  return {
    requirements: formattedRequirements,
    isLoading,
    error,
    refetch,
  };
};