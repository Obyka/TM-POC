// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "hardhat/console.sol";
import "./Agreement.sol";

contract FactoryCloneAgreement {
    address public immutable agreementImpl;
    
    mapping(address => address) public agreementToContract;
    event AgreementCreated(address[] _coArtists, address _contract);

    constructor() {
        agreementImpl = address(new Agreement());
    }

    function createAgreement(address[] memory  _artists, address _collection_address, uint _tokenId, bytes32 salt) external returns (address){
        address clone = Clones.cloneDeterministic(agreementImpl, salt);
        console.log("Creating Agreement clone with address %s",clone);
        console.logBytes32(salt);
        console.log("Deployer %s",msg.sender);
        console.log("Agreement impl %s",agreementImpl);

        uint64[3] memory tierPrice = [0.1 ether, 0.2 ether, 0.4 ether];
        Agreement(clone).initialize(_collection_address, _tokenId, _artists, msg.sender, tierPrice);
        agreementToContract[msg.sender] = clone;
        emit AgreementCreated(_artists, clone);
        console.log("Event emitted");
        return clone;
    }

    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) public view returns (address predicted) {
        address cloneAddress = Clones.predictDeterministicAddress(implementation, salt);
        console.log("Predicting address with address %s",cloneAddress);
        console.logBytes32(salt);
        console.log("Deployer %s",deployer);
        console.log("Agreement impl %s",implementation);
        return cloneAddress;
    }
}