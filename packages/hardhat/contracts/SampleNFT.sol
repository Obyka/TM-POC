// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SampleNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint royaltiesInBps;
    address royaltiesReceiver; 
    // To ensure OpenZepplin can read royalties infos
    string public contractURI;

    constructor(uint96 _royaltiesInBps, string memory _contractURI, address _royaltiesReceiver) ERC721("MyToken", "MTK") 
    {
        royaltiesInBps = _royaltiesInBps;
        contractURI = _contractURI;
        royaltiesReceiver = _royaltiesReceiver;
    }

    function computeRoyalties(uint _salePrice) view public returns(uint256){
        return _salePrice / 10000 * royaltiesInBps;
    }

    function safeMint(address to, string memory uri)
        public
    {
        uint256 newItemId = _tokenIds.current();
        _safeMint(to, newItemId);
        _setTokenURI(newItemId, uri);
        _tokenIds.increment();
    }

    // The following functions are overrides required by Solidity.

     function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external view returns (
        address receiver,
        uint256 royaltyAmount
    ){
        _tokenId++;
        return (royaltiesReceiver, computeRoyalties(_salePrice));
    }

    function setRoyaltyInfo(address _newReceiver, uint _newRoyaltiesInBps) public onlyOwner{
        royaltiesInBps = _newRoyaltiesInBps;
        royaltiesReceiver = _newReceiver;
    }

    function setContractURI(string calldata _contractURI) public onlyOwner{
        contractURI = _contractURI;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }
}