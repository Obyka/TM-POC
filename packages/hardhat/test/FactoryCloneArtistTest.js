const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FactoryCloneArtist tests", function () {

    async function deployContracts(){

        const rightsholder1Sig = await ethers.getNamedSigner("rightsholder1")
        const rightsholder2Sig = await ethers.getNamedSigner("rightsholder2")
        const artist1Sig = await ethers.getNamedSigner("artist1")
        const artist2Sig = await ethers.getNamedSigner("artist2")

        const FactoryCloneArtist = await ethers.getContractFactory("FactoryCloneArtist");
        const factoryCloneArtist = await FactoryCloneArtist.deploy();
        return {factoryCloneArtist, rightsholder1Sig, rightsholder2Sig, artist1Sig, artist2Sig} 
    }

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    before((done) => {
        setTimeout(done, 2000);
    });

    describe("Artist clone creation", function () {
        it("Should emit an ArtistContractCreated event", async function () {
            const {factoryCloneArtist, rightsholder1Sig, rightsholder2Sig, artist1Sig, artist2Sig} = await loadFixture(deployContracts)
            const rightHolders = [rightsholder1Sig.address, rightsholder2Sig.address]
            const shares = [50, 50]
            await expect(factoryCloneArtist.connect(artist1Sig).createArtist(rightHolders, shares))
                .to.emit(factoryCloneArtist, 'ArtistContractCreated')
                .withArgs(artist1Sig.address, anyValue, rightHolders, shares);
        });
        it("Should save artist -> contract association in mapping", async function () {
            const {factoryCloneArtist, rightsholder1Sig, rightsholder2Sig, artist1Sig, artist2Sig} = await loadFixture(deployContracts)
            const rightHolders = [rightsholder1Sig.address, rightsholder2Sig.address]
            const shares = [50, 50]
            const tx = await factoryCloneArtist.connect(artist1Sig).createArtist(rightHolders, shares)
            const receipt = await tx.wait()
            const creationEvent = receipt.events.filter(x => x.event == "ArtistContractCreated")
            expect(await factoryCloneArtist.artistToContract(artist1Sig.address))
                .to.equal(creationEvent[0]
                .args._contract)

        });
    });
});
