// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deploy("NFTFractionner", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
  });
  const NFTFractionner = await ethers.getContract("NFTFractionner", deployer);

  await deploy("SampleNFT", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
    args: [250, "blup", "0x27C7530049c5E20ed05964eC6c6D5299Ae0dF95A"]
  });
  const SampleNFT = await ethers.getContract("SampleNFT", deployer);

  await deploy("Artist", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
  });
  const Artist = await ethers.getContract("Artist", deployer);

  await deploy("FactoryCloneArtist", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
  });
  const FactoryCloneArtist = await ethers.getContract("FactoryCloneArtist", deployer);

  await deploy("RightHolder", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
  });
  const RightHolder = await ethers.getContract("RightHolder", deployer);

  await deploy("FactoryCloneRightHolder", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
  });
  const FactoryCloneRightHolder = await ethers.getContract("FactoryCloneRightHolder", deployer);
  
  await deploy("Agreement", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
  });
  const Agreement = await ethers.getContract("Agreement", deployer);

  await deploy("FactoryCloneAgreement", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
  });
  const FactoryCloneAgreement = await ethers.getContract("FactoryCloneAgreement", deployer);

};
module.exports.tags = ["NFTFractionner", "SampleNFT", "Artist", "FactoryCloneArtist", "FactoryCloneRightHolder", "Agreement", "FactoryCloneAgreement"];
