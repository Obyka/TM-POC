// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

contract RightHolder is Ownable{

    event Received(address from, uint amount);
    event Withdraw(address to, uint amount);

    function initialize() external {

    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function withdraw() public onlyOwner {
        require(address(this).balance > 0, "No ether to withdraw");
        address payable to = payable(msg.sender);
        uint amountToWithdraw = address(this).balance;
        sendViaCall(to, amountToWithdraw);
        emit Withdraw(to, amountToWithdraw);
    }

    function sendViaCall(address payable _to, uint _value) internal {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        (bool sent,) = _to.call{value: _value}("");
        require(sent, "Failed to send Ether");
    }
}