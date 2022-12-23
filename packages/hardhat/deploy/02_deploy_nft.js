const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();


    await deploy("SampleNFT", {
        from: deployer,
        log: true,
        waitConfirmations: 5,
        args: ["blup"]
      });
    const SampleNFT = await ethers.getContract("SampleNFT", deployer);

};
module.exports.tags = ["nft"];
