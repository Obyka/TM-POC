// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Artist.sol";

contract FactoryCloneArtist {
    address immutable public artistImpl;
    mapping(address => address) public artistToContract;
    event ArtistContractCreated(address indexed _artist, address _contract);

    constructor() {
        artistImpl = address(new Artist());
    }

    function createArtist(address[] memory  _recipients, uint[] memory _shares) external returns (address){
        address clone = Clones.clone(artistImpl);
        Artist(payable(clone)).initialize(_recipients, _shares);
        artistToContract[msg.sender] = clone;
        emit ArtistContractCreated(msg.sender, clone);
        return clone;
    }
}