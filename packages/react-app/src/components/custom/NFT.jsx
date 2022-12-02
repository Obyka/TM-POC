import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button, Card, Empty, List } from "antd";
import { create } from "ipfs-http-client";
export const NFTABI = [
  "function safeMint(address to, string memory uri) public returns (uint256 newTokenId)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function setContractURI(string calldata _contractURI) public",
  "function supportsInterface(bytes4 interfaceId) public view virtual",
  "function setTokenRoyalty(uint tokenId, address receiver, uint96 feeNumerator) external",
];
const { BufferList } = require("bl");
const projectId = process.env.REACT_APP_IPFS_PROJECT_ID;
const projectSecret = process.env.REACT_APP_IPFS_PROJECT_SECRET;
const authorization = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

let ipfs;
try {
  ipfs = create({
    url: "https://ipfs.infura.io:5001/api/v0",
    headers: {
      authorization,
    },
  });
} catch (error) {
  console.log(error);
  ipfs = undefined;
}

const getFromIPFS = async hashToGet => {
  const content = new BufferList();
  for await (const chunk of ipfs.cat(hashToGet)) {
    content.append(chunk);
  }
  return JSON.parse(content.toString());
};

export default function NFT({ tx, readContracts, localProvider, userSigner, nftAddress, price, tokenId }) {
  console.log(`price: ${price}`);
  function updateNotif(update) {
    console.log("📡 Transaction Update:", update);
    if (update && (update.status === "confirmed" || update.status === 1)) {
      console.log(" 🍾 Transaction " + update.hash + " finished!");
      console.log(
        " ⛽️ " +
          update.gasUsed +
          "/" +
          (update.gasLimit || update.gas) +
          " @ " +
          parseFloat(update.gasPrice) / 1000000000 +
          " gwei",
      );
    }
  }

  async function extractNFTInfo() {
    let nft;
    if (nftContract === -1) {
      nft = new ethers.Contract(nftAddress, NFTABI, userSigner);
      setNftContract(nft);
    } else {
      nft = nftContract;
    }

    let metadata = await nft.tokenURI(tokenId);
    if (metadata) {
      const ipfsHash = metadata.replace("ipfs://", "");
      const objectMetadata = await getFromIPFS(ipfsHash);
      if (objectMetadata) {
        setIpfsHash(ipfsHash);
        setObjectMetadata(objectMetadata);
        setTitle(`NFT #${tokenId}`);
        setDescription(objectMetadata.description);
        setNftPrice(price);
      }
    }
  }

  const [nftContract, setNftContract] = useState(-1);
  const [ipfsHash, setIpfsHash] = useState("");
  const [objectMetadata, setObjectMetadata] = useState({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nftPrice, setNftPrice] = useState(0);

  useEffect(() => {
    extractNFTInfo();
  }, []);

  return (
    <Card
      hoverable
      style={{
        width: 240,
        margin: "auto",
      }}
      cover={<img alt="NFT Image" src={objectMetadata.image} />}
    >
      <Card.Meta title={title} description={description} />
      {price && <>Price: {ethers.utils.formatEther(nftPrice)} Ξ</>}
    </Card>
  );
}
