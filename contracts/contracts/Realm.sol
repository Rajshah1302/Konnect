// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

/**
 * @title Realm
 * @notice Verified metarealm and IRL experiences with Self Protocol
 */
contract Realm is SelfVerificationRoot {
    address public creator;
    string public title;
    string public description;
    int256 public latitude;
    int256 public longitude;
    uint256 public ticketPrice;
    uint256 public capacity;
    uint256 public realmDate;
    bytes32 public verificationConfigId;
    bool public requiresMaleOnly;
    bool public requiresFemaleOnly;
    uint256 public minimumAge; // Added minimum age field

    uint256 public attendeeCount = 0;
    mapping(address => bool) public verifiedUsers;
    mapping(address => bool) public attendees;
    address[] public attendeeList;

    event UserVerified(address indexed user, string gender, string nationality);
    event UserJoined(address indexed user, uint256 amountPaid);

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
        _;
    }

    struct RealmParams {
        address creator;
        string title;
        string description;
        int256 longitude;
        int256 latitude;
        uint256 ticketPrice;
        uint256 capacity;
        uint256 realmDate;
        bytes32 verificationConfigId;
        bool requiresMaleOnly;
        bool requiresFemaleOnly;
        uint256 minimumAge; // Added to RealmParams struct
    }

    constructor(
        RealmParams memory params,
        address _identityVerificationHubV2,
        string memory _scopeSeed  
    ) SelfVerificationRoot(_identityVerificationHubV2, _scopeSeed) {
        require(params.creator != address(0), "Invalid creator");
        require(bytes(params.title).length > 0, "Title cannot be empty");
        require(params.capacity > 0, "Capacity must be > 0");
        require(params.realmDate > block.timestamp, "Realm date must be in future");

        creator = params.creator;
        title = params.title;
        description = params.description;
        longitude = params.longitude;
        latitude = params.latitude;
        ticketPrice = params.ticketPrice;
        capacity = params.capacity;
        realmDate = params.realmDate;
        verificationConfigId = params.verificationConfigId;
        requiresMaleOnly = params.requiresMaleOnly;
        requiresFemaleOnly = params.requiresFemaleOnly;
        minimumAge = params.minimumAge; 
        attendees[params.creator] = true;
        attendeeList.push(params.creator);
        attendeeCount++;
    }

    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory _output,
        bytes memory _userData
    ) internal override {
        address userAddress = address(uint160(_output.userIdentifier));
        _validateRequirements(_output);
        verifiedUsers[userAddress] = true;
        emit UserVerified(userAddress, _output.gender, _output.nationality);
    }

    function _validateRequirements(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output
    ) internal view {
        if (requiresMaleOnly) {
            require(
                keccak256(abi.encodePacked(output.gender)) == keccak256(abi.encodePacked("M")),
                "Males only"
            );
        }
        if (requiresFemaleOnly) {
            require(
                keccak256(abi.encodePacked(output.gender)) == keccak256(abi.encodePacked("F")),
                "Females only"
            );
        }
        if (minimumAge > 0) {
            require(
                output.olderThan >= minimumAge,
                "Does not meet minimum age requirement"
            );
        }
    }

    function joinRealm() external payable {
        require(verifiedUsers[msg.sender], "Complete verification first");
        require(!attendees[msg.sender], "Already joined");
        require(attendeeCount < capacity, "Realm at capacity");
        require(block.timestamp < realmDate, "Realm has passed");
        require(msg.value >= ticketPrice, "Insufficient payment");

        attendees[msg.sender] = true;
        attendeeList.push(msg.sender);
        attendeeCount++;

        if (ticketPrice > 0) {
            (bool success, ) = creator.call{value: ticketPrice}("");
            require(success, "Payment failed");
        }

        uint256 excess = msg.value - ticketPrice;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }

        emit UserJoined(msg.sender, ticketPrice);
    }

    function getConfigId(
        bytes32 _destinationChainId,
        bytes32 _userIdentifier,
        bytes memory _userDefinedData
    ) public view override returns (bytes32) {
        return verificationConfigId;
    }

    // View functions
    function getRealmDetails()
        external
        view
        returns (
            string memory _title,
            string memory _description,
            uint256 _ticketPrice,
            uint256 _capacity,
            uint256 _realmDate,
            uint256 _attendeeCount
        )
    {
        return (title, description, ticketPrice, capacity, realmDate, attendeeCount);
    }

    function getRealmRequirements()
        external
        view
        returns (
            bool _requiresMaleOnly,
            bool _requiresFemaleOnly,
            uint256 _minimumAge // Added minimum age to return values
        )
    {
        return (requiresMaleOnly, requiresFemaleOnly, minimumAge);
    }

    function getRealmLocation() external view returns (int256 _latitude, int256 _longitude) {
        return (latitude, longitude);
    }

    function getAttendeeList() external view returns (address[] memory) {
        return attendeeList;
    }

    function isUserVerified(address user) external view returns (bool) {
        return verifiedUsers[user];
    }

    function isUserAttending(address user) external view returns (bool) {
        return attendees[user];
    }
}