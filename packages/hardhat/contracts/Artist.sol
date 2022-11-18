// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Artist is Ownable{
    struct Recipient{
        uint share;
        uint balance;
    }

    mapping(address => Recipient) public recipientStruct;
    address[] public recipientList;
    uint totalShares;

    event Received(address from, uint amount);
    event Withdraw(address to, uint amount);

    event Debug(uint recipientShare, uint amountToRedeem, uint totalShare);

    function initialize(address[] memory  _recipients, uint[] memory _shares) external {
        setRecipients(_recipients, _shares);
    }

    function setRecipients(address[] memory  _recipients, uint[] memory _shares) internal {
        for (uint i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            require(recipient != address(0), "invalid owner");
            uint share = _shares[i];
            totalShares += share;

            recipientStruct[recipient].share = share;
            recipientStruct[recipient].balance = 0;
            recipientList.push(recipient);
        }
    }

    function splitPayment(uint amount) internal{
        for(uint i = 0; i < recipientList.length; i++){
            address recipientAddress = recipientList[i];
            uint recipientShare = recipientStruct[recipientAddress].share;
            uint amountToRedeem = amount * recipientShare / totalShares;
            recipientStruct[recipientAddress].balance += amountToRedeem;
            emit Debug(recipientShare, amountToRedeem, totalShares);
        }
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
        splitPayment(msg.value);
    }

    function withdraw() public {
        require(recipientStruct[msg.sender].balance > 0, "No ether to withdraw");
        address payable to = payable(msg.sender);
        uint amountToWithdraw = recipientStruct[msg.sender].balance;
        recipientStruct[msg.sender].balance = 0;
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