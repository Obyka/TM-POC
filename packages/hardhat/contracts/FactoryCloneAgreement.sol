// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "hardhat/console.sol";
import "./Agreement.sol";

contract FactoryCloneAgreement {
    address public immutable agreementImpl;
    address public immutable settings;
    
    mapping(address => address) public agreementToContract;
    event AgreementCreated(address[] _coArtists, address _contract);

    constructor(address _settings) {
        agreementImpl = address(new Agreement());
        settings = _settings;
    }

    function createAgreement(address[] memory  _artists, uint _tokenId, bytes32 salt) external returns (address){
        address clone = Clones.cloneDeterministic(agreementImpl, salt);
        console.log("Creating Agreement clone with address %s",clone);
        console.logBytes32(salt);
        console.log("Deployer %s",msg.sender);
        console.log("Agreement impl %s",agreementImpl);

        Agreement(payable(clone)).initialize(_tokenId, _artists, msg.sender, settings);
        agreementToContract[msg.sender] = clone;
        emit AgreementCreated(_artists, clone);
        console.log("Event emitted");
        return clone;
    }

    function predictDeterministicAddress(
        address implementation,
        bytes32 salt
    ) public view returns (address predicted) {
        address cloneAddress = Clones.predictDeterministicAddress(implementation, salt);
        return cloneAddress;
    }
}