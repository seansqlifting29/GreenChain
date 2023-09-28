// Allowing users to donate funds for carbon offsetting
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonOffsetDonation {

    address public owner;
    bool private locked = false;

    // Event to notify when a donation is made
    event DonationReceived(address indexed donor, uint256 amount);

    // Set the contract deployer as the owner
    constructor() {
        owner = msg.sender;
    }

    // Modifier to restrict functions only for the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // Reentrancy guard
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // Function to accept donations
    function donate() external payable {
        require(msg.value > 0, "Must send a positive value");
        emit DonationReceived(msg.sender, msg.value);
    }

    // Function for the owner to withdraw funds for carbon offset projects
    function withdrawFunds(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
    }

    // Function to check the balance of the contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
