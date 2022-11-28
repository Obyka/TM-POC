// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SampleNFT is ERC2981, ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address royaltiesReceiver; 
    // To ensure OpenZepplin can read royalties infos
    string public contractURI;

    constructor(string memory _contractURI) ERC721("Tyxit", "TYX") 
    {
        contractURI = _contractURI;
    }


    function safeMint(address to, string memory uri)
        public
        returns (uint256 newTokenId)
    {
        uint256 newItemId = _tokenIds.current();
        _safeMint(to, newItemId);
        _setTokenURI(newItemId, uri);
        _tokenIds.increment();
        return newItemId;
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

    function setContractURI(string calldata _contractURI) public onlyOwner{
        contractURI = _contractURI;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC2981, ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setTokenRoyalty(uint tokenId, address receiver, uint96 feeNumerator) external{
        super._setTokenRoyalty(tokenId, receiver, feeNumerator);
    }
}