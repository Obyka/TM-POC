const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
describe("FactoryCloneAgreement tests", function () {


    async function deployContracts(){

        const SampleNFTContract = await ethers.getContractFactory("SampleNFT");
        const nftContract = await SampleNFTContract.deploy("");

        const rightsholder1Sig = await ethers.getNamedSigner("rightsholder1")
        const rightsholder2Sig = await ethers.getNamedSigner("rightsholder2")
        const artist1Sig = await ethers.getNamedSigner("artist1")
        const artist2Sig = await ethers.getNamedSigner("artist2")

        const SettingsContract = await ethers.getContractFactory("Settings");
        const settingsContract = await SettingsContract.deploy(nftContract.address) 

        const FactoryCloneAgreement = await ethers.getContractFactory("FactoryCloneAgreement");
        const factoryCloneAgreement = await FactoryCloneAgreement.deploy(settingsContract.address);
        return {settingsContract, factoryCloneAgreement, artist1Sig, artist2Sig, rightsholder1Sig, rightsholder2Sig}
        
    };

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    before((done) => {
        setTimeout(done, 2000);
    });

    describe("Clone address prediction", function () {

        it("Should predict same address when same params", async function () {
            const {settingsContract, factoryCloneAgreement, artist1Sig, artist2Sig, rightsholder1Sig, rightsholder2Sig} = await loadFixture(deployContracts);
            const salt = ethers.utils.randomBytes(32);
            const implementationAddress = await factoryCloneAgreement.agreementImpl();
            const deployer = artist1Sig.address;

            const pred1 = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt);
            const pred2 = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt);

            expect(pred1).to.equal(pred2)

        });

        it("Should predict different address with different salt", async function () {
            const {settingsContract, factoryCloneAgreement, artist1Sig, artist2Sig, rightsholder1Sig, rightsholder2Sig} = await loadFixture(deployContracts);
            const salt1 = ethers.utils.randomBytes(32);
            const salt2 = ethers.utils.randomBytes(32);

            const implementationAddress = await factoryCloneAgreement.agreementImpl();
            const deployer1 = artist1Sig.address;

            const pred1 = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt1);
            const pred2 = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt2);

            expect(pred1).to.not.equal(pred2)

        });
    });


});
