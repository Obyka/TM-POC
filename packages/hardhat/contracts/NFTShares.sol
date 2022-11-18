// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

//https://ethereum.stackexchange.com/questions/13167/are-there-well-solved-and-simple-storage-patterns-for-solidity

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract NFTShares is ERC721Holder {

    // Events
    event Init();
    event PriceProposition(address indexed _owner, uint _value);
    event ForSale(uint _price);
    event Purchase(address indexed _buyer, uint _value);
    event Redeem(address indexed _owner, uint _value);
    event RoyaltiesPaid(address indexed _to, uint amount);


    struct Owner { 
        uint share;
        uint proposedPrice;
        bool proposed;
        bool isOwner;
        bool hasRedeem;
    }
    enum State {Uninitialized, Initialized, ForSale, Redeem}
    State public contractState;

    mapping(address => Owner) public ownersStruct;
    address[] public ownerList;
    uint public salePrice;
    address royalties_address;
    uint royalties_basis_points;

    IERC721 collection;
    address collection_address;
    uint tokenId;

    // Check if the NFT implements ERC2981
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    function isOwner(address ownerAddress) public view returns(bool isIndeed) {
      return ownersStruct[ownerAddress].isOwner;
    }

    function newOwner(address ownerAddress, uint share) internal {
        require(!isOwner(ownerAddress));
        ownersStruct[ownerAddress].share = share;
        ownersStruct[ownerAddress].proposedPrice = 0;
        ownersStruct[ownerAddress].proposed = false;
        ownersStruct[ownerAddress].isOwner = true;
        ownersStruct[ownerAddress].hasRedeem = false;
    }

    modifier onlyOwner() {
        require(isOwner(msg.sender), "not owner");
        _;
    }


    function putForSale() external onlyOwner {
        require(contractState == State.Initialized, "Contract not initialized yet");
        for(uint i = 0; i < ownerList.length; i++){
            require(ownersStruct[ownerList[i]].proposed, "Every owner must propose a price");
        }
        contractState = State.ForSale;
        emit ForSale(salePrice);
    }

    function initialize(address _collectionAddress, uint256 _tokenId, address[] memory  _owners, uint[] memory _shares) external {
        require(contractState == State.Uninitialized, "Already initialized");
        require(_owners.length == _shares.length, "Owners and Shares must have the same length");

        setOwners(_owners, _shares);

        collection = IERC721(_collectionAddress);
        collection_address = _collectionAddress;
        collection.safeTransferFrom(msg.sender, address(this), _tokenId);
        tokenId = _tokenId;
        contractState = State.Initialized;
        emit Init();
    }

    function setOwners(address[] memory  _owners, uint[] memory _shares) internal{
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            uint share = _shares[i];

            require(owner != address(0), "invalid owner");

            newOwner(owner, share);
            ownerList.push(owner);
        }
    }

    function purchase() external payable {
        require(contractState == State.ForSale, "Can not purchase yet");
        require(msg.value >= salePrice, "Not enough ether sent");
        // Si ERC2981 est supportée, on récupère les infos pour les royalties
        if(checkRoyalties(collection_address)){
            address receiver;
            uint amount;
            (receiver, amount) = IERC2981(collection_address).royaltyInfo(tokenId, msg.value);
            sendViaCall(payable(receiver), amount);
            emit RoyaltiesPaid(receiver, amount);
        }
        collection.transferFrom(address(this), msg.sender, tokenId);
        contractState = State.Redeem;
        emit Purchase(msg.sender, msg.value);
    }

    function setOwnerPrice(uint price) onlyOwner external{
        require(contractState == State.Initialized, "Contract must be initialized.");
        require(price > 0, "Price must be greater than zero");
        require(!ownersStruct[msg.sender].proposed, "Owner already proposed a price");
        ownersStruct[msg.sender].proposed = true;
        ownersStruct[msg.sender].proposedPrice = price;
        salePrice = max(price, salePrice);
        emit PriceProposition(msg.sender, price);
    }

        /** @dev Permet aux possesseurs de fractions de récupérer leur dû
      */
    function redeem() onlyOwner external {
        require(contractState == State.Redeem, "Can not redeem yet");
        require(!ownersStruct[msg.sender].hasRedeem, "Owner has already redeemed");
        ownersStruct[msg.sender].hasRedeem = true;
        // TO-DO: Vérifier opération
        uint256 toRedeem = ownersStruct[msg.sender].share * salePrice / 100;
        payable(msg.sender).transfer(toRedeem);
        emit Redeem(msg.sender, toRedeem);
    }

    constructor()
    {
        contractState = State.Uninitialized;
    }

    function sendViaCall(address payable _to, uint _value) internal {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        (bool sent,) = _to.call{value: _value}("");
        require(sent, "Failed to send Ether");
    }

    function checkRoyalties(address _contract) internal view returns (bool) {
    (bool success) = IERC165(_contract).supportsInterface(_INTERFACE_ID_ERC2981);
    return success;
 }

}
