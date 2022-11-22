// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Artist is Ownable{
    struct RightsHolder{
        uint shareInBPS;
        uint balance;
    }

    mapping(address => RightsHolder) public rightsHolderMap;
    address[] public rightsHolderList;
    uint rightsHoldersSharesInBPS;
    uint artistShareInBPS;

    uint public constant basis = 10000;

    event Received(address from, uint amount);
    event Withdraw(address to, uint amount);
    event AffiliationCreated(address artistContract, address rightHolderContract, uint rightsHoldersSharesInBPS);

    function initialize(address[] memory  _rightsHolders, uint[] memory _shares) external {
        setRightsHolders(_rightsHolders, _shares);
        require(rightsHoldersSharesInBPS <= basis, "Sum of shares is greater than 100%");
        artistShareInBPS = basis - rightsHoldersSharesInBPS;
        require(artistShareInBPS + rightsHoldersSharesInBPS == basis, "Invalid share amount");
    }

    function setRightsHolders(address[] memory  _rightsHolders, uint[] memory _shares) internal {
        for (uint i = 0; i < _rightsHolders.length; i++) {
            address rightsHolder = _rightsHolders[i];
            require(rightsHolder != address(0), "invalid address for rights holder");
            uint share = _shares[i];
            rightsHoldersSharesInBPS += share;

            rightsHolderMap[rightsHolder].shareInBPS = share;
            rightsHolderMap[rightsHolder].balance = 0;
            rightsHolderList.push(rightsHolder);
            emit AffiliationCreated(address(this), rightsHolder, share);
        }
    }

    function splitPayment(uint amount) internal{
        for(uint i = 0; i < rightsHolderList.length; i++){
            address rightsHolderAddress = rightsHolderList[i];
            uint rightsHolderShare = rightsHolderMap[rightsHolderAddress].shareInBPS;
            uint amountToRedeem = amount * rightsHolderShare / basis;
            rightsHolderMap[rightsHolderAddress].balance += amountToRedeem;
        }
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
        splitPayment(msg.value);
    }

    function withdraw() public {
        require(rightsHolderMap[msg.sender].balance > 0, "No ether to withdraw");
        address payable to = payable(msg.sender);
        uint amountToWithdraw = rightsHolderMap[msg.sender].balance;
        rightsHolderMap[msg.sender].balance = 0;
        sendViaCall(to, amountToWithdraw);
        emit Withdraw(to, amountToWithdraw);
    }

    function sendViaCall(address payable _to, uint _value) internal {
        (bool sent,) = _to.call{value: _value}("");
        require(sent, "Failed to send Ether");
    }
}