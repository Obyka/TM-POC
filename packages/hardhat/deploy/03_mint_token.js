const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(deployer)
    const URI = "ipfs://QmWXfgniwrRWiguFHjGSE317M9cSJAY14bZrYCgJ9dKP4K"

    const nftContract = await ethers.getContractAt("SampleNFT", "0x2e2e3046b0ceadC568757A53dCd33eF90fc6DBC8");
    await nftContract.safeMint(deployer, URI)

};
module.exports.tags = ["uri"];


