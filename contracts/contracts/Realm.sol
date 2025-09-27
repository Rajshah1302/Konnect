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
    uint256 public minimumAge; 
    string[] public allowedCountries;    
    string[] public blockedCountries;

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
        uint256 minimumAge; 
        string[] allowedCountries;
        string[] blockedCountries;
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
        minimumAge = params.minimumAge; // Initialize minimum age
        
        // Initialize country restrictions
        for (uint i = 0; i < params.allowedCountries.length; i++) {
            allowedCountries.push(params.allowedCountries[i]);
        }
        for (uint i = 0; i < params.blockedCountries.length; i++) {
            blockedCountries.push(params.blockedCountries[i]);
        }
        
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
                _calculateAgeFromDOB(output.dateOfBirth) >= minimumAge,
                "Does not meet minimum age requirement"
            );
        }
        
        // Validate country requirements
        _validateCountryRequirements(output.nationality);
    }

    function _calculateAgeFromDOB(string memory dateOfBirth) internal view returns (uint256) {
        require(bytes(dateOfBirth).length == 8, "Invalid DOB format");
        
        // DOB format: "DDMMYYYY" (8 characters)
        string memory dayStr = _substring(dateOfBirth, 0, 2);      // DD
        string memory monthStr = _substring(dateOfBirth, 2, 4);    // MM  
        string memory yearStr = _substring(dateOfBirth, 4, 8);     // YYYY
        
        uint256 birthDay = _stringToUint(dayStr);
        uint256 birthMonth = _stringToUint(monthStr);
        uint256 birthYear = _stringToUint(yearStr);
        
        uint256 currentYear = _getCurrentYear();
        uint256 currentMonth = _getCurrentMonth();
        uint256 currentDay = _getCurrentDay();
        
        uint256 age = currentYear - birthYear;
        
        // Adjust if birthday hasn't occurred this year yet
        if (currentMonth < birthMonth || 
            (currentMonth == birthMonth && currentDay < birthDay)) {
            age = age - 1;
        }
        
        return age;
    }

    // Helper function to extract substring
    function _substring(string memory str, uint256 start, uint256 end) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(end <= strBytes.length && start < end, "Invalid substring range");
        
        bytes memory result = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = strBytes[i];
        }
        return string(result);
    }

    // Helper function to convert string to uint
    function _stringToUint(string memory str) internal pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            uint256 digit = uint256(uint8(b[i])) - 48; // ASCII '0' is 48
            require(digit <= 9, "Invalid numeric character");
            result = result * 10 + digit;
        }
        return result;
    }

    // Helper function to get current year
    function _getCurrentYear() internal view returns (uint256) {
        return 1970 + (block.timestamp / 31557600); // Approximate
    }

    // Helper function to get current month (1-12)
    function _getCurrentMonth() internal view returns (uint256) {
        uint256 secondsInYear = 31557600;
        uint256 yearProgress = (block.timestamp % secondsInYear);
        return (yearProgress / 2629800) + 1; // Approximate month
    }

    // Helper function to get current day (1-31)
    function _getCurrentDay() internal view returns (uint256) {
        uint256 secondsInMonth = 2629800;
        uint256 monthProgress = (block.timestamp % secondsInMonth);
        return (monthProgress / 86400) + 1; // Days in current month
    }

    function _validateCountryRequirements(string memory nationality) internal view {
        // Check blocked countries first
        for (uint i = 0; i < blockedCountries.length; i++) {
            require(
                keccak256(abi.encodePacked(nationality)) != keccak256(abi.encodePacked(blockedCountries[i])),
                "Country not permitted"
            );
        }
        
        // If no allowed countries specified, accept all (except blocked)
        if (allowedCountries.length == 0) {
            return;
        }
        
        // Check if nationality is in allowed list
        for (uint i = 0; i < allowedCountries.length; i++) {
            if (keccak256(abi.encodePacked(nationality)) == keccak256(abi.encodePacked(allowedCountries[i]))) {
                return; // Found in allowed list
            }
        }
        
        revert("Country not in allowed list");
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
            uint256 _minimumAge, // Added minimum age to return values
            string[] memory _allowedCountries,
            string[] memory _blockedCountries
        )
    {
        return (requiresMaleOnly, requiresFemaleOnly, minimumAge, allowedCountries, blockedCountries);
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

    function getAllowedCountries() external view returns (string[] memory) {
        return allowedCountries;
    }

    function getBlockedCountries() external view returns (string[] memory) {
        return blockedCountries;
    }
}