// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "hardhat/console.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Artist.sol";

contract FactoryCloneArtist {
    address immutable public artistImpl;
    mapping(address => address) public artistToContract;
    event ArtistContractCreated(address indexed _artist, address _contract, address[] _rightsHolders, uint[] _sharesInBPS);

    constructor() {
        artistImpl = address(new Artist());
    }

    function createArtist(address[] memory  _rightsHolders, uint[] memory _sharesInBPS) external returns (address){
        address clone = Clones.clone(artistImpl);
        Artist(payable(clone)).initialize(msg.sender, _rightsHolders, _sharesInBPS);
        artistToContract[msg.sender] = clone;
        emit ArtistContractCreated(msg.sender, clone, _rightsHolders, _sharesInBPS);
        return clone;
    }
}