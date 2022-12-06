const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
describe("FactoryCloneArtist tests", function () {

    let factoryCloneArtist;
    let rightsholder1Sig
    let rightsholder2Sig
    let artist1Sig
    let artist2Sig



    beforeEach(async () => {

        rightsholder1Sig = await ethers.getNamedSigner("rightsholder1")
        rightsholder2Sig = await ethers.getNamedSigner("rightsholder2")
        artist1Sig = await ethers.getNamedSigner("artist1")
        artist2Sig = await ethers.getNamedSigner("artist2")

        const FactoryCloneArtist = await ethers.getContractFactory("FactoryCloneArtist");
        factoryCloneArtist = await FactoryCloneArtist.deploy();
    });

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    before((done) => {
        setTimeout(done, 2000);
    });

    describe("Artist clone creation", function () {
        it("Should emit an ArtistContractCreated event", async function () {
            const rightHolders = [rightsholder1Sig.address, rightsholder2Sig.address]
            const shares = [50, 50]
            // createArtist(address[] memory  _rightsHolders, uint[] memory _sharesInBPS)
            await expect(factoryCloneArtist.connect(artist1Sig).createArtist(rightHolders, shares))
                .to.emit(factoryCloneArtist, 'ArtistContractCreated')
                .withArgs(artist1Sig.address, anyValue, rightHolders, shares);
        });
        it("Should save artist -> contract association in mapping", async function () {
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
