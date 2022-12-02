// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";
import "./IArtist.sol";

contract Artist is IArtist, OwnableUpgradeable, ERC165StorageUpgradeable{
    struct RightsHolder {
        uint shareInBPS;
        uint balance;
        uint minimalTier;
        uint minimalRoyaltiesInBps;
        bool isRightHolder;
    }

    mapping(address => RightsHolder) public rightsHolderMap;
    address[] public rightsHolderList;
    uint rightsHoldersSharesInBPS;
    uint artistShareInBPS;
    uint maxPreconditionTier;
    uint maxPreconditionRoyaltiesInBps;

    uint public constant basis = 10000;

    event Init(
        address indexed _artist,
        address[] _rightsHolders,
        uint[] _sharesInBPS
    );
    event Received(address from, uint amount);
    event Withdraw(address to, uint amount);
    event AffiliationCreated(
        address artistContract,
        address rightHolderContract,
        uint rightsHoldersSharesInBPS
    );

    function initialize(
        address _artist,
        address[] memory _rightsHolders,
        uint[] memory _shares
    ) initializer external override {
        setRightsHolders(_rightsHolders, _shares);
        require(
            rightsHoldersSharesInBPS <= basis,
            "Sum of shares is greater than 100%"
        );
        artistShareInBPS = basis - rightsHoldersSharesInBPS;
        require(
            artistShareInBPS + rightsHoldersSharesInBPS == basis,
            "Invalid share amount"
        );
        _registerInterface(type(IArtist).interfaceId);
        __Ownable_init();
        __ERC165Storage_init();
        transferOwnership(_artist);
        emit Init(_artist, _rightsHolders, _shares);
    }

    function setRightsHolders(
        address[] memory _rightsHolders,
        uint[] memory _shares
    ) internal {
        for (uint i = 0; i < _rightsHolders.length; i++) {
            address rightsHolder = _rightsHolders[i];
            require(
                rightsHolder != address(0),
                "invalid address for rights holder"
            );
            uint share = _shares[i];
            rightsHoldersSharesInBPS += share;

            rightsHolderMap[rightsHolder].shareInBPS = share;
            rightsHolderMap[rightsHolder].balance = 0;
            rightsHolderMap[rightsHolder].minimalTier = 0;
            rightsHolderMap[rightsHolder].minimalRoyaltiesInBps = 0;
            rightsHolderMap[rightsHolder].isRightHolder = true;

            rightsHolderList.push(rightsHolder);
            emit AffiliationCreated(address(this), rightsHolder, share);
        }
    }

    function isRightsHolder(
        address rightsHolderAddress
    ) public view returns (bool isIndeed) {
        return rightsHolderMap[rightsHolderAddress].isRightHolder;
    }

    function setPreconditions(
        uint _minimalRoyaltiesInBps,
        uint _minimalTier
    ) external override {
        require(isRightsHolder(msg.sender), "Sender is not a right holder");
        require(_minimalRoyaltiesInBps <= 10000);
        require(_minimalTier <= 2);

        rightsHolderMap[msg.sender]
            .minimalRoyaltiesInBps = _minimalRoyaltiesInBps;
        rightsHolderMap[msg.sender].minimalTier = _minimalTier;

        maxPreconditionRoyaltiesInBps = maxPreconditionRoyaltiesInBps <
            _minimalRoyaltiesInBps
            ? _minimalRoyaltiesInBps
            : maxPreconditionRoyaltiesInBps;

        maxPreconditionTier = maxPreconditionTier < _minimalTier
            ? _minimalTier
            : maxPreconditionTier;
    }

    function splitPayment(uint amount) internal {
        for (uint i = 0; i < rightsHolderList.length; i++) {
            address rightsHolderAddress = rightsHolderList[i];
            uint rightsHolderShare = rightsHolderMap[rightsHolderAddress]
                .shareInBPS;
            uint amountToRedeem = (amount * rightsHolderShare) / basis;
            rightsHolderMap[rightsHolderAddress].balance += amountToRedeem;
        }
    }

    receive() external payable override(IArtist) {
        emit Received(msg.sender, msg.value);
        splitPayment(msg.value);
    }

    function withdraw() public override {
        require(
            rightsHolderMap[msg.sender].balance > 0,
            "No ether to withdraw"
        );
        address payable to = payable(msg.sender);
        uint amountToWithdraw = rightsHolderMap[msg.sender].balance;
        rightsHolderMap[msg.sender].balance = 0;
        sendViaCall(to, amountToWithdraw);
        emit Withdraw(to, amountToWithdraw);
    }

    function sendViaCall(address payable _to, uint _value) internal {
        (bool sent, ) = _to.call{value: _value}("");
        require(sent, "Failed to send Ether");
    }

    function getPreconditions() external view override returns(uint _minimalRoyaltiesInBps, uint _minimalTier){
        return (maxPreconditionRoyaltiesInBps, maxPreconditionTier);
    }


    function getArtistAddress() external view override returns(address _artist){
        return owner();
    }
}
