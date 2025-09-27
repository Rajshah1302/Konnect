// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./Realm.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";

/**
 * @title RealmFactory
 * @notice Factory for deploying realms
 */
contract RealmFactory {
    address public owner;
    address public immutable identityVerificationHubV2;
    
    address[] public allRealms;
    mapping(address => address[]) public creatorRealms;
    mapping(address => bool) public isValidRealm;
    
    event RealmCreated(
        address indexed realmContract,
        address indexed creator,
        string title,
        uint256 ticketPrice,
        uint256 capacity
    );
    
    constructor(address _identityVerificationHubV2) {
        require(_identityVerificationHubV2 != address(0), "Invalid hub address");
        identityVerificationHubV2 = _identityVerificationHubV2;
        owner = msg.sender;
    }
    
    bytes32 public constant VERIFICATION_CONFIG_ID = 0xc52f992ebee4435b00b65d2c74b12435e96359d1ccf408041528414e6ea687bc;
    
    function createRealm(
        string memory title,
        string memory description,
        int256 latitude,
        int256 longitude,
        uint256 ticketPrice,
        uint256 capacity,
        uint256 realmDate,
        bool requiresMaleOnly,
        bool requiresFemaleOnly
    ) external returns (address realmAddress) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(capacity > 0, "Capacity must be > 0");
        require(realmDate > block.timestamp, "Realm date must be in future");
        require(!(requiresMaleOnly && requiresFemaleOnly), "Cannot be both male and female only");
        
        Realm.RealmParams memory realmParams = Realm.RealmParams({
            creator: msg.sender,
            title: title,
            description: description,
            longitude: longitude,
            latitude: latitude,
            ticketPrice: ticketPrice,
            capacity: capacity,
            realmDate: realmDate,
            verificationConfigId: VERIFICATION_CONFIG_ID,
            requiresMaleOnly: requiresMaleOnly,
            requiresFemaleOnly: requiresFemaleOnly
        });
        
        string memory scopeSeed = "konnect";
        
        Realm newRealm = new Realm(
            realmParams,
            identityVerificationHubV2,
            scopeSeed
        );
        
        realmAddress = address(newRealm);
        
        allRealms.push(realmAddress);
        creatorRealms[msg.sender].push(realmAddress);
        isValidRealm[realmAddress] = true;
        
        emit RealmCreated(realmAddress, msg.sender, title, ticketPrice, capacity);
        
        return realmAddress;
    }
    
    function getCreatorRealms(address creator) external view returns (address[] memory) {
        return creatorRealms[creator];
    }
    
    function getTotalRealms() external view returns (uint256) {
        return allRealms.length;
    }
    
    function getRealms(uint256 start, uint256 limit) external view returns (address[] memory realms) {
        require(start < allRealms.length, "Start index out of bounds");
        
        uint256 end = start + limit;
        if (end > allRealms.length) {
            end = allRealms.length;
        }
        
        realms = new address[](end - start);
        for (uint256 i = start; i < end; i++) {
            realms[i - start] = allRealms[i];
        }
    }
    
    function getRealmsDetails(address[] memory realmAddresses) external view returns (
        string[] memory titles,
        uint256[] memory ticketPrices,
        uint256[] memory capacities,
        uint256[] memory realmDates,
        uint256[] memory attendeeCounts
    ) {
        uint256 length = realmAddresses.length;
        titles = new string[](length);
        ticketPrices = new uint256[](length);
        capacities = new uint256[](length);
        realmDates = new uint256[](length);
        attendeeCounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            if (isValidRealm[realmAddresses[i]]) {
                Realm realmContract = Realm(realmAddresses[i]);
                (
                    titles[i],
                    ,
                    ticketPrices[i],
                    capacities[i],
                    realmDates[i],
                    attendeeCounts[i]
                ) = realmContract.getRealmDetails();
            }
        }
    }
}