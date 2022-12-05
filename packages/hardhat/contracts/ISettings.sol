// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ISettings {
    function feeAmount() external view returns (uint256);

    function feeReceiver() external view returns (address payable);

    function administrator() external view returns (address payable);

    function getTierPrices() external view returns (uint[3] memory);

    function collectionAddress() external view returns(address payable);
}
