// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./ISettings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Settings is Ownable, ISettings {
    /// @notice Max fee in BPS for royalties and primary sales
    uint256 public constant maxFeeAmount = 1000;

    /// @notice fee in BPS for royalties and primary sales
    uint256 public override feeAmount;

    /// @notice The address that can claims fees
    address payable public override feeReceiver;

    /// @notice The address that can manage (cancel) agreements
    address payable public override administrator;

    /// @notice Prices for Silver, Gold and Platinium tiers respectively
    uint[3] private tierPrices;

    /// @notice Max prices for Silver, Gold and Platinium tiers respectively
    uint[3] public maxTierPrices = [1 ether, 2 ether, 4 ether];

    /// @notice Tyxit NFT collection address
    address payable public override collectionAddress;

    constructor(address payable _collectionAddress) {
        require(_collectionAddress != address(0));
        feeAmount = 500;
        feeReceiver = payable(msg.sender);
        administrator = payable(msg.sender);
        tierPrices = [0.1 ether, 0.2 ether, 0.4 ether];
        collectionAddress = _collectionAddress;
    }

    event UpdateFeeAmount(uint256 _old, uint256 _new);
    event UpdateFeeReceiver(address _old, address _new);
    event UpdateAdministrator(address _old, address _new);
    event UpdateTierPrices(uint[3] _old, uint[3] _new);
    event UpdateCollectionAddress(address _old, address _new);

    function getTierPrices() external view override returns(uint[3] memory) {
        return tierPrices;
    }

    function setFeeAmount(uint256 _feesInBPS) external onlyOwner {
        require(_feesInBPS <= maxFeeAmount, "Fee greater than max");
        emit UpdateFeeAmount(feeAmount, _feesInBPS);
        feeAmount = _feesInBPS;
    }

    function setFeeReceiver(address payable _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Null address");
        emit UpdateFeeReceiver(feeReceiver, _feeReceiver);
        feeReceiver = _feeReceiver;
    }

    function setAdministrator(address payable _administrator) external onlyOwner {
        require(_administrator != address(0), "Null address");
        emit UpdateAdministrator(administrator, _administrator);
        administrator = _administrator;
    }

    function setCollectionAddress(address payable _collectionAddress) external onlyOwner {
        require(_collectionAddress != address(0), "Null address");
        emit UpdateCollectionAddress(collectionAddress, _collectionAddress);
        collectionAddress = _collectionAddress;
    }

    function setTierPrices(uint[3] memory _tierPrices) external onlyOwner {
        require(_tierPrices[1] >= _tierPrices[0], "Tier prices not sorted");
        require(_tierPrices[2] >= _tierPrices[1], "Tier prices not sorted");
        require(_tierPrices[0] <= maxTierPrices[0],"Price greater than max");
        require(_tierPrices[1] <= maxTierPrices[1], "Price greater than max");
        require(_tierPrices[2] <= maxTierPrices[2], "Price greater than max");

        emit UpdateTierPrices(tierPrices, _tierPrices);
        tierPrices = _tierPrices;
    }
}

