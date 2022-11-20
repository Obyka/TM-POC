// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Agreement.sol";

contract FactoryCloneAgreement {
    address public immutable agreementImpl;
    
    mapping(address => address) public agreementToContract;
    event AgreementCreated(address[] indexed _coArtists, address _contract);

    constructor() {
        agreementImpl = address(new Agreement());

    }

    function createAgreement(address[] memory  _artists, address _collection_address, uint _tokenId) external returns (address){
        address clone = Clones.clone(agreementImpl);
        Agreement(payable(clone)).initialize(_collection_address, _tokenId, _artists);
        agreementToContract[msg.sender] = clone;
        emit AgreementCreated(_artists, clone);
        return clone;
    }
}