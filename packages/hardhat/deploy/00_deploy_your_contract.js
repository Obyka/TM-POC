// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deploy("SampleNFT", {
    from: deployer,
    log: true,
    waitConfirmations: 5,
    args: ["blup"]
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
module.exports.tags = ["SampleNFT", "Artist", "FactoryCloneArtist", "Agreement", "FactoryCloneAgreement"];
