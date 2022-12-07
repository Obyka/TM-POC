// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";
import "./IArtist.sol";

contract Artist is IArtist, OwnableUpgradeable, ERC165StorageUpgradeable {
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
    event MinimalTierUpdated(address _rightsholder, uint _old, uint _new);
    event MinimalRoyaltiesUpdated(address _rightsholder, uint _old, uint _new);

    function initialize(
        address _artist,
        address[] memory _rightsHolders,
        uint[] memory _shares
    ) external override initializer {
        setRightsHolders(_rightsHolders, _shares, _artist);
        _registerInterface(type(IArtist).interfaceId);
        __Ownable_init();
        __ERC165Storage_init();
        transferOwnership(_artist);
        emit Init(_artist, _rightsHolders, _shares);
    }

    function setRightsHolders(
        address[] memory _rightsHolders,
        uint[] memory _shares,
        address _artist
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
            rightsHolderMap[rightsHolder].isRightHolder = true;

            rightsHolderList.push(rightsHolder);
            emit AffiliationCreated(address(this), rightsHolder, share);
        }

        require(
            rightsHoldersSharesInBPS <= basis,
            "Sum of shares is greater than 100%"
        );
        artistShareInBPS = basis - rightsHoldersSharesInBPS;

        rightsHolderMap[_artist].shareInBPS = artistShareInBPS;
        rightsHolderMap[_artist].isRightHolder = true;
        rightsHolderList.push(_artist);
        emit AffiliationCreated(address(this), _artist, artistShareInBPS);
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
        require(
            _minimalRoyaltiesInBps <= 10000,
            "minimalRoyaltiesInBps is greater than 10000"
        );
        require(_minimalTier <= 2, "minimalTier is greater than 2");

        uint oldMinimalRoyaltiesInBps = rightsHolderMap[msg.sender]
            .minimalRoyaltiesInBps;
        uint oldMinimalTier = rightsHolderMap[msg.sender].minimalTier;

        if (oldMinimalRoyaltiesInBps != _minimalRoyaltiesInBps) {
            emit MinimalRoyaltiesUpdated(
                msg.sender,
                oldMinimalRoyaltiesInBps,
                _minimalRoyaltiesInBps
            );
            rightsHolderMap[msg.sender]
                .minimalRoyaltiesInBps = _minimalRoyaltiesInBps;
        }

        if (oldMinimalTier != _minimalTier) {
            emit MinimalTierUpdated(
                msg.sender,
                oldMinimalTier,
                _minimalTier
            );
            rightsHolderMap[msg.sender]
                .minimalTier = _minimalTier;
        }

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

    function getPreconditions()
        external
        view
        override
        returns (uint _minimalRoyaltiesInBps, uint _minimalTier)
    {
        return (maxPreconditionRoyaltiesInBps, maxPreconditionTier);
    }

    function getArtistAddress()
        external
        view
        override
        returns (address _artist)
    {
        return owner();
    }
}
