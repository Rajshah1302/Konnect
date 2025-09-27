const REALM_FACTORY_ADDRESS = "0x2505bbCb6F3Efb401D181A77B3F76925465de919";
const REALM_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_identityVerificationHubV2",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "realmContract",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "title",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "ticketPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "capacity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minimumAge",
        type: "uint256",
      },
    ],
    name: "RealmCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "VERIFICATION_CONFIG_ID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "allRealms",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "title",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "int256",
        name: "latitude",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "longitude",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "ticketPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "capacity",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "realmDate",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "requiresMaleOnly",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "requiresFemaleOnly",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "minimumAge",
        type: "uint256",
      },
      {
        internalType: "string[]",
        name: "allowedCountries",
        type: "string[]",
      },
      {
        internalType: "string[]",
        name: "blockedCountries",
        type: "string[]",
      },
    ],
    name: "createRealm",
    outputs: [
      {
        internalType: "address",
        name: "realmAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "creatorRealms",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "getCreatorRealms",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "limit",
        type: "uint256",
      },
    ],
    name: "getRealms",
    outputs: [
      {
        internalType: "address[]",
        name: "realms",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "realmAddresses",
        type: "address[]",
      },
    ],
    name: "getRealmsDetails",
    outputs: [
      {
        internalType: "string[]",
        name: "titles",
        type: "string[]",
      },
      {
        internalType: "uint256[]",
        name: "ticketPrices",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "capacities",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "realmDates",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "attendeeCounts",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "minimumAges",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "realmAddresses",
        type: "address[]",
      },
    ],
    name: "getRealmsRequirements",
    outputs: [
      {
        internalType: "bool[]",
        name: "requiresMaleOnly",
        type: "bool[]",
      },
      {
        internalType: "bool[]",
        name: "requiresFemaleOnly",
        type: "bool[]",
      },
      {
        internalType: "uint256[]",
        name: "minimumAges",
        type: "uint256[]",
      },
      {
        internalType: "string[][]",
        name: "allowedCountries",
        type: "string[][]",
      },
      {
        internalType: "string[][]",
        name: "blockedCountries",
        type: "string[][]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalRealms",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "identityVerificationHubV2",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isValidRealm",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export { REALM_FACTORY_ABI, REALM_FACTORY_ADDRESS };
