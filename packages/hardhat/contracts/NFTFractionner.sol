// SPDX-License-Identifier: MIT
// https://gist.github.com/shobhitic/a6190d62298e0b1a010059db23eda564
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

// Sert à stocker un NFT, à diviser sa valeur en plusieurs parts, à le vendre et à l'acheter
contract NFTFractionner is ERC20, Ownable, ERC20Permit, ERC721Holder {
    // Permet d'initialiser le contrat du NFT à verrouiller
    //IERC721 public collection;
    
    struct NFT { 
        IERC721 collection;
        uint256 tokenID;
        bool forSale;
        bool canRedeem;
        uint256 salePrice;
        bool initialized;
    }

    // L'ID du NFT à verrouiller
    //uint256 public tokenId;
    //bool public initialized = false;
    //bool public forSale = false;
    //uint256 public salePrice;
    //bool public canRedeem = false;
    string _domainName = "NFTFraction";
    string _tokenName = "NFTFraction";
    string _symbolName = "NFTF";

    mapping(address => NFT) nfts;

    // On crée le token qui sert de liquidité
    constructor() ERC20(_tokenName, _symbolName) ERC20Permit(_domainName) {}


    /** @dev Initialise le contrat, verrouille un NFT et mint les jetons fongibles
      * @param _collection Adresse du contrat du NFT
      * @param _tokenId ID du NFT à verrouiller
      * @param _amount Montant de Token fongibles à minter
      */
    function initialize(address _collection, uint256 _tokenId, uint256 _amount) external {
        require(!nfts[msg.sender].initialized, "Already initialized");
        require(_amount > 0, "Amount needs to be more than 0");

        nfts[msg.sender] = NFT(
                {
                     collection: IERC721(_collection),
                     tokenID: _tokenId,
                     forSale: false,
                     canRedeem: false,
                     salePrice: 0,
                     initialized: true
                }
            );
        nfts[msg.sender].collection.safeTransferFrom(msg.sender, address(this), _tokenId);
        //collection = IERC721(_collection);
        //collection.safeTransferFrom(msg.sender, address(this), _tokenId);
        //tokenId = _tokenId;
        //initialized = true;
        _mint(msg.sender, _amount);
    }

    /** @dev Met le token en vente
      * @param price Prix de vente en wei
      */
    function putForSale(uint256 price) external onlyOwner {
        require(nfts[msg.sender].initialized, "Contract not initialized yet");
        nfts[msg.sender].salePrice = price;
        nfts[msg.sender].forSale = true;
        //require(initialized, "Contract not initialized yet");
        //salePrice = price;
        //forSale = true;
    }

    /** @dev Permet d'acheter le NFT mis en vente
      */
    function purchase(address initialOwner) external payable {
        require(nfts[initialOwner].initialized, "Contract not initialized yet");
        require(nfts[initialOwner].forSale, "Not for sale");
        require(msg.value >= nfts[initialOwner].salePrice, "Not enough ether sent");
        nfts[initialOwner].collection.transferFrom(address(this), msg.sender, nfts[initialOwner].tokenID);
        nfts[initialOwner].forSale = false;
        nfts[initialOwner].canRedeem = true;
    }

    /** @dev Permet aux possesseurs de fractions de récupérer leur dû
      */
    function redeem(uint256 _amount, address initialOwner) external {
        require(nfts[initialOwner].initialized, "Contract not initialized yet");
        require(nfts[initialOwner].canRedeem, "Not sold yet");
        uint256 totalEther = address(this).balance;
        uint256 toRedeem = _amount * totalEther / totalSupply();
        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(toRedeem);
    }
}