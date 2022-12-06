const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
describe("FactoryCloneAgreement tests", function () {

    let settingsContract;
    let nftContract;
    let factoryCloneAgreement;
    let rightsholder1Sig
    let rightsholder2Sig
    let artist1Sig
    let artist2Sig


    beforeEach(async () => {

        const SampleNFTContract = await ethers.getContractFactory("SampleNFT");
        nftContract = await SampleNFTContract.deploy("");

        rightsholder1Sig = await ethers.getNamedSigner("rightsholder1")
        rightsholder2Sig = await ethers.getNamedSigner("rightsholder2")
        artist1Sig = await ethers.getNamedSigner("artist1")
        artist2Sig = await ethers.getNamedSigner("artist2")

        const SettingsContract = await ethers.getContractFactory("Settings");
        settingsContract = await SettingsContract.deploy(nftContract.address) 

        const FactoryCloneAgreement = await ethers.getContractFactory("FactoryCloneAgreement");
        factoryCloneAgreement = await FactoryCloneAgreement.deploy(settingsContract.address);

        
    });

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    before((done) => {
        setTimeout(done, 2000);
    });

    /*it("Should emit an AgreementCreated event", async function () {
        const artists = [artist1Sig.address, artist2Sig.address]
        const shares = [50, 50]

        await expect(factoryCloneAgreement.connect(artist1Sig).createArtist(rightHolders, shares))
            .to.emit(factoryCloneArtist, 'ArtistContractCreated')
            .withArgs(artist1Sig.address, anyValue, rightHolders, shares);
    });*/
    describe("Clone address prediction", function () {

        it("Should predict same address when same params", async function () {
            const salt = ethers.utils.randomBytes(32);
            const implementationAddress = await factoryCloneAgreement.agreementImpl();
            const deployer = artist1Sig.address;

            const pred1 = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt);
            const pred2 = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt);

            expect(pred1).to.equal(pred2)

        });

        it("Should predict different address with different salt", async function () {
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
