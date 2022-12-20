// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// @title Tyxit - ISettings 
/// @author Florian Polier
/// @notice An interface for specifying which settings must be available in the POC
interface ISettings {

/**
 * @dev Gets the fee amount for transactions
 * @return Fee amount
 */
function feeAmount() external view returns (uint256);

/**
 * @dev Gets the address of the fee receiver
 * @return Fee receiver address
 */
function feeReceiver() external view returns (address payable);

/**
 * @dev Gets the address of the contract administrator
 * @return Administrator address
 */
function administrator() external view returns (address payable);

/**
 * @dev Gets the tier prices for purchase of tokens
 * @return Array of tier prices
 */
function getTierPrices() external view returns (uint[3] memory);

/**
 * @dev Gets the collection address for the Tyxit collection
 * @return Funds collection address
 */
function collectionAddress() external view returns(address payable);
}
