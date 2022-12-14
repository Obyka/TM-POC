// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Tyxit - IArtist
/// @author Florian Polier
/// @notice An interface that specifies what an adhesion contract must implement
interface IArtist {
    /**
     * @dev Initializes the contract with the given parameters.
     * @param artist The address of the artist.
     * @param _rightsHolders Array of addresses of rights holders.
     * @param _shares Array of shares corresponding to the rights holders.
     * @notice All given arrays must have the same length.
     */
    function initialize(
        address artist,
        address[] memory _rightsHolders,
        uint[] memory _shares
    ) external;

    /**
     * @dev Sets the preconditions for the contract.
     * @param _minimalRoyaltiesInBps The minimal royalties in basis points.
     * @param _minimalTier The minimal tier.
     */
    function setPreconditions(
        uint _minimalRoyaltiesInBps,
        uint _minimalTier
    ) external;

    /**
     * @dev Withdraws the funds from the contract.
     */
    function withdraw() external;

    /**
     * @dev Returns the preconditions of the contract.
     * @return _minimalRoyaltiesInBps The minimal royalties in basis points.
     * @return _minimalTier The minimal tier.
     */
    function getPreconditions()
        external
        view
        returns (uint _minimalRoyaltiesInBps, uint _minimalTier);

    /**
     * @dev Returns the address of the artist.
     * @return _artist The address of the artist.
     */
    function getArtistAddress() external view returns (address _artist);

    /**
     * @dev Receive function that handles and distributes incoming payments.
     */
    receive() external payable;
}
