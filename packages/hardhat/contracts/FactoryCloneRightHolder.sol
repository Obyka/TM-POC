// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./RightHolder.sol";

contract FactoryCloneRightHolder {
    address immutable public rightHolderImpl;
    mapping(address => address) public rightHolderToContract;
    event RightHolderCreated(address indexed _artist, address _contract);

    constructor() {
        rightHolderImpl = address(new RightHolder());
    }

    function createRightHolder() external returns (address){
        address clone = Clones.clone(rightHolderImpl);
        RightHolder(payable(clone)).initialize();
        rightHolderToContract[msg.sender] = clone;
        emit RightHolderCreated(msg.sender, clone);
        return clone;
    }
}