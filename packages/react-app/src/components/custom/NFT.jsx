export const NFTABI = [
  "function safeMint(address to, string memory uri) public returns (uint256 newTokenId)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function setContractURI(string calldata _contractURI) public",
  "function supportsInterface(bytes4 interfaceId) public view virtual",
  "function setTokenRoyalty(uint tokenId, address receiver, uint96 feeNumerator) external",
];
