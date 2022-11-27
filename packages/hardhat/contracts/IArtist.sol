// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IArtist {
    
    function initialize(address artist, address[] memory _rightsHolders, uint[] memory _shares) external;
    function setPreconditions(uint _minimalRoyaltiesInBps, uint _minimalTier) external;
    function withdraw() external;
    function checkAgreementValidity(uint _royaltiesInBps, uint _Tier) external view returns(bool isValid);
    function getArtistAddress() external view returns(address _artist);
    receive() external payable;

}
