// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Tyxit - SampleNFT
/// @author Florian Polier
/// @notice This contract is the Tyxit NFT.
contract SampleNFT is
    ERC2981,
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // To ensure OpenZepplin can read royalties infos
    string public contractURI;

    constructor(string memory _contractURI) ERC721("Tyxit", "TYX") {
        contractURI = _contractURI;
    }

    /// @notice Create a new token and transfer it to the given address
    /// @param to The address to which the token is transferred
    /// @param uri The URI associated with the token
    /// @return _newTokenId The ID of the newly minted token
    function safeMint(
        address to,
        string memory uri
    ) public returns (uint256 _newTokenId) {
        uint256 newItemId = _tokenIds.current();
        _safeMint(to, newItemId);
        _setTokenURI(newItemId, uri);
        _tokenIds.increment();
        return newItemId;
    }

    /// @notice Internal function to call before transferring a token
    /// @param from The address sending the token
    /// @param to The address receiving the token
    /// @param tokenId The token ID to be transferred
    /// @param batchSize The number of tokens being transferred
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /// @notice Burn the specified token
    /// @param tokenId The ID of the token to be burned
    function burn(uint tokenId) external {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: caller is not token owner or approved"
        );
        _burn(tokenId);
    }

    /// @notice Get the URI associated with the specified token
    /// @param tokenId The ID of the token
    /// @return The URI associated with the token
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function setContractURI(string calldata _contractURI) public onlyOwner {
        contractURI = _contractURI;
    }

    /**
     * @dev Check whether the contract implements a given interface
     * @param interfaceId The interface identifier
     * @return bool True if the contract implements the interface, false otherwise
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC2981, ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Set a royalty fee for a given token
     * @param tokenId The token ID
     * @param receiver The address of the receiver of the royalty fee
     * @param feeNumerator The numerator for the royalty fee
     * @notice Only callable by the owner of the token or an approved address
     */
    function setTokenRoyalty(
        uint tokenId,
        address receiver,
        uint96 feeNumerator
    ) external {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: caller is not token owner or approved"
        );
        super._setTokenRoyalty(tokenId, receiver, feeNumerator);
    }
}
