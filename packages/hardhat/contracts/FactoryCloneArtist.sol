// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Artist.sol";

/// @title Tyxit - FactoryCloneArtist 
/// @author Florian Polier
/// @notice This contract creates and manages Artist (adhesion) contracts 
contract FactoryCloneArtist {

    address immutable public artistImpl;
    mapping(address => address) public artistToContract;
    
    /**
     * @dev Constructor that sets the artist implementation address
     */
    constructor() {
        artistImpl = address(new Artist());
    }

    /**
     * @dev Creates a clone of the artist contract and initializes the contract 
     * 
     * @param _rightsHolders Array of address containing the rights holders
     * @param _sharesInBPS Array of uint representing the shares in basis points
     * @return The address of the new cloned contract 
     */
    function createArtist(address[] memory  _rightsHolders, uint[] memory _sharesInBPS) external returns (address) {
        address clone = Clones.clone(artistImpl);
        Artist(payable(clone)).initialize(msg.sender, _rightsHolders, _sharesInBPS);
        artistToContract[msg.sender] = clone;
        emit ArtistContractCreated(msg.sender, clone, _rightsHolders, _sharesInBPS);
        return clone;
    }

    /**
     * @dev Event emitted when an artist contract is created
     * 
     * @param _artist Address of the artist
     * @param _contract Address of the contract
     * @param _rightsHolders Array of address containing the rights holders
     * @param _sharesInBPS Array of uint representing the shares in basis points
     */
    event ArtistContractCreated(address indexed _artist, address _contract, address[] _rightsHolders, uint[] _sharesInBPS);
}