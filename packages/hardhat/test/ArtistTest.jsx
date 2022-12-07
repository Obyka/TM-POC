const { ethers } = require("hardhat");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Artist tests", function () {
    let rightsholder1Sig
    let rightsholder2Sig
    let artist1Sig
    let artist2Sig
    let rightHolders
    let shares
    let artistShare;

    async function deployContracts() {

        const FactoryCloneArtist = await ethers.getContractFactory("FactoryCloneArtist");
        const factoryCloneArtist = await FactoryCloneArtist.deploy();

        const tx = await factoryCloneArtist.connect(artist1Sig).createArtist(rightHolders, shares)
        const artistAddress = await factoryCloneArtist.artistToContract(artist1Sig.address)

        const ArtistContract = await ethers.getContractFactory("Artist");
        const artistContract = await ArtistContract.attach(artistAddress);

        return { artistContract, artist1Sig, artist2Sig, shares, tx }
    }

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    before((done) => {
        setTimeout(done, 2000);
    });

    before(async () => {
        rightsholder1Sig = await ethers.getNamedSigner("rightsholder1")
        rightsholder2Sig = await ethers.getNamedSigner("rightsholder2")
        artist1Sig = await ethers.getNamedSigner("artist1")
        artist2Sig = await ethers.getNamedSigner("artist2")

        rand1 = Math.floor(Math.random() * 10001);
        rand2 = Math.floor(Math.random() * (10001 - rand1));

        shares = [4000, 4000]
        rightHolders = [rightsholder1Sig.address, rightsholder2Sig.address]
        artistShare = 10000 - 8000
    })

    describe("Artist init", function () {
        it("Should emit an Init event", async function () {

            const { artistContract,
                artist1Sig,
                shares,
                tx } = await loadFixture(deployContracts)


            await expect(tx)
                .to.emit(artistContract, 'Init')
                .withArgs(artist1Sig.address, rightHolders, shares);
        });

        it("Should emit an Affiliation event per rightholder", async function () {

            const { artistContract,
                artist1Sig,
                shares,
                tx } = await loadFixture(deployContracts)


            await expect(tx).to.emit(artistContract, 'AffiliationCreated').withArgs(artistContract.address, rightHolders[0], shares[0]);
            await expect(tx).to.emit(artistContract, 'AffiliationCreated').withArgs(artistContract.address, rightHolders[1], shares[1]);
            await expect(tx).to.emit(artistContract, 'AffiliationCreated').withArgs(artistContract.address, artist1Sig.address, artistShare);


        });


        it("Should have set rightsholders", async function () {
            const { artistContract,
                artist1Sig,
                shares,
                tx } = await loadFixture(deployContracts)

            expect(await artistContract.isRightsHolder(rightHolders[0])).to.be.equal(true);
            expect(await artistContract.isRightsHolder(rightHolders[1])).to.be.equal(true);
        });

        it("Should have transferred ownership to the artist", async function () {
            const { artistContract,
                artist1Sig,
                shares,
                tx } = await loadFixture(deployContracts)

            expect(await artistContract.owner()).to.be.equal(artist1Sig.address);
        });

        it("Should revert if rightsholders' address are invalid", async function () {
            const FactoryCloneArtist = await ethers.getContractFactory("FactoryCloneArtist");
            const factoryCloneArtist = await FactoryCloneArtist.deploy();
            const rightHolders = [ethers.constants.AddressZero, rightsholder2Sig.address]
            const shares = [50, 50]


            await expect(factoryCloneArtist.connect(artist1Sig).createArtist(rightHolders, shares))
                .to.be.revertedWith("invalid address for rights holder");
        });

        it("Should revert if sum of shares are greater than 10000", async function () {
            const FactoryCloneArtist = await ethers.getContractFactory("FactoryCloneArtist");
            const factoryCloneArtist = await FactoryCloneArtist.deploy();
            const rightHolders = [rightsholder1Sig.address, rightsholder2Sig.address]
            const shares = [10000, 1]


            await expect(factoryCloneArtist.connect(artist1Sig).createArtist(rightHolders, shares))
                .to.be.revertedWith("Sum of shares is greater than 100%");
        });
    });

    describe("Set preconditions", function () {
        it("Should accept and update valid precondition from valid rights holders", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.connect(rightsholder1Sig).setPreconditions(1000, 1)).to.not.be.reverted
            const preconditions = await artistContract.connect(rightsholder1Sig).getPreconditions()
            expect(preconditions[0]).to.be.equal(1000)
            expect(preconditions[1]).to.be.equal(1)

        });

        it("Should revert when caller is not a rights holder", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.connect(artist2Sig).setPreconditions(1000, 1)).to.be.revertedWith("Sender is not a right holder")
        });

        it("Should revert when minimalRoyaltiesInBps is greater than 10000", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.connect(rightsholder1Sig).setPreconditions(10001, 1)).to.be.revertedWith("minimalRoyaltiesInBps is greater than 10000")
        });

        it("Should revert when minimalTier is greater than 2", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.connect(rightsholder1Sig).setPreconditions(1000, 3)).to.be.revertedWith("minimalTier is greater than 2")
        });

        it("Should emit MinimalTierUpdated when minimalTier is correctly updated", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.connect(rightsholder1Sig).setPreconditions(0, 1))
                .to.emit(artistContract, 'MinimalTierUpdated').
                withArgs(rightsholder1Sig.address, 0, 1);
        });

        it("Should emit MinimalRoyaltiesUpdated when minimalTier is correctly updated", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.connect(rightsholder1Sig).setPreconditions(1000, 0))
                .to.emit(artistContract, 'MinimalRoyaltiesUpdated').
                withArgs(rightsholder1Sig.address, 0, 1000);
        });
    });

    describe("is RightsHolder?", function () {
        it("Should return false when param is not a rightsholder", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            expect(await artistContract.connect(rightsholder1Sig).isRightsHolder(artist2Sig.address)).to.equal(false);
        });

        it("Should return true when param is a rightsholder", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            expect(await artistContract.connect(rightsholder1Sig).isRightsHolder(rightsholder1Sig.address)).to.equal(true);
        });
    });

    describe("fallback function", function () {
        it("Should emit Received event", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artist1Sig.sendTransaction({ to: artistContract.address, value: ethers.utils.parseEther("1.0") }))
                .to.emit(artistContract, "Received")
                .withArgs(artist1Sig.address, ethers.utils.parseEther("1.0"));
        });

        it("Should splitPayment according to shares", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await artist1Sig.sendTransaction({ to: artistContract.address, value: ethers.utils.parseEther("1.0") })
            let values = await artistContract.rightsHolderMap(rightsholder1Sig.address)
            const rightHolderValue = { ...values }
            expect(rightHolderValue.balance).to.be.equal(ethers.utils.parseEther("0.4"))

        });

    });

    describe("Withdraw function", function () {
        it("Should revert when there is not eth to withdraw", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.withdraw()).to.be.revertedWith("No ether to withdraw")
        });

        it("Should revert when there is not eth to withdraw", async function () {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await expect(artistContract.withdraw()).to.be.revertedWith("No ether to withdraw")
        });

        it("Should transfer all rights holder balance", async function() {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await artist1Sig.sendTransaction({ to: artistContract.address, value: ethers.utils.parseEther("1.0") })
            let values = await artistContract.rightsHolderMap(rightsholder1Sig.address)
            const rightHolderValue = { ...values }

            await expect(artistContract.connect(rightsholder1Sig)
            .withdraw())
            .to.changeEtherBalance(rightsholder1Sig, rightHolderValue.balance);

        });

        it("Should set rights holder balance to 0 after withdraw", async function() {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await artist1Sig.sendTransaction({ to: artistContract.address, value: ethers.utils.parseEther("1.0") })

            await artistContract.connect(rightsholder1Sig).withdraw()
            let values = await artistContract.rightsHolderMap(rightsholder1Sig.address)
            const rightHolderValue = { ...values }
            expect(rightHolderValue.balance).to.be.equal(0)
        });

        it("Should emit Withdraw event with correct params", async function() {
            const { artistContract, tx } = await loadFixture(deployContracts)
            await artist1Sig.sendTransaction({ to: artistContract.address, value: ethers.utils.parseEther("1.0") })

            await expect(artistContract.connect(rightsholder1Sig)
            .withdraw())
            .to.emit(artistContract, "Withdraw")
            .withArgs(rightsholder1Sig.address, ethers.utils.parseEther("0.4"))
        });

    });


});
