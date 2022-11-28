// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IArtist {
    
    function initialize(address artist, address[] memory _rightsHolders, uint[] memory _shares) external;
    function setPreconditions(uint _minimalRoyaltiesInBps, uint _minimalTier) external;
    function withdraw() external;
    function getPreconditions() external view returns(uint _minimalRoyaltiesInBps, uint _minimalTier);
    function getArtistAddress() external view returns(address _artist);
    receive() external payable;

}
