const { ethers } = require("hardhat");
const { expect } = require("chai");


describe("NFT tests", function () {

    let nftContract;
    let artist1Sig;

    beforeEach(async () => {
        const SampleNFTContract = await ethers.getContractFactory("SampleNFT");
        artist1Sig = await ethers.getNamedSigner("artist1")
        nftContract = await SampleNFTContract.deploy("testURI");

    });

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    before((done) => {
        setTimeout(done, 2000);
    });

    describe("SampleNFT deployment", function () {
        it("Should init NFT contract", async function () {
            expect(await nftContract.contractURI()).to.equal("testURI");
        });
    });

    describe("SampleNFT safeMint", function () {
        it("safeMint function should return new tokenId", async function () {
            let owner = ethers.Wallet.createRandom();
            let tokenId = await nftContract.callStatic.safeMint(owner.address, "")
            expect(tokenId).to.equal(0);
        });

        it("safeMint function should set tokenURI", async function () {
            const newTokenURI = "newTokenURI"
            let owner = ethers.Wallet.createRandom();
            let tokenId = await nftContract.callStatic.safeMint(owner.address, newTokenURI)
            await nftContract.safeMint(owner.address, newTokenURI)

            expect(await nftContract.tokenURI(tokenId)).to.equal(newTokenURI);
        });

        it("safeMint function should increment new tokenId", async function () {
            let owner = ethers.Wallet.createRandom();
            await nftContract.safeMint(owner.address, "")
            let tokenId = await nftContract.callStatic.safeMint(owner.address, "")
            expect(tokenId).to.equal(1);
        });
    });

    describe("SampleNFT contractURI", function () {
        it("Owner can modify contractURI", async function () {
            const newContractURI = "newContractURI"
            await nftContract.setContractURI(newContractURI);
            expect(await nftContract.contractURI()).to.equal(newContractURI);
        });

        it("setContractURI should revert if not called by the owner", async function () {
            await expect(nftContract.connect(artist1Sig).setContractURI("newContractURI")).to.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("SampleNFT royaltyInfo", function () {
        it("royaltyInfo function should return correct royalty info", async function () {
            const tokenId = await nftContract.callStatic.safeMint(artist1Sig.address, "")
            await nftContract.safeMint(artist1Sig.address, "")
            await nftContract.connect(artist1Sig).setTokenRoyalty(tokenId, artist1Sig.address, 1000)

            const royalty = await nftContract.royaltyInfo(0, ethers.utils.parseEther("1"))
            expect(royalty[1]).to.equal(ethers.utils.parseEther("0.1"));
            expect(royalty[0]).to.equal(artist1Sig.address);
        });

        it("royaltyInfo function should revert when caller is not owner", async function () {
            let legitime_owner = ethers.Wallet.createRandom();
            let not_owner = ethers.Wallet.createRandom();
            let tokenId = await nftContract.callStatic.safeMint(legitime_owner.address, "")
            await nftContract.safeMint(legitime_owner.address, "")

            await expect(nftContract.connect(artist1Sig).setTokenRoyalty(tokenId.toNumber(), not_owner.address, 1000)).to.be.revertedWith("ERC721: caller is not token owner or approved")
        });

    });

    describe("SampleNFT ERC-165", function () {

        it("Smart contract should support ERC2981 interface via ERC165", async function () {
            let interfaceID = "0x2a55205a";
            expect(await nftContract.supportsInterface(interfaceID)).to.equal(true);
        });

        it("Smart contract should support ERC721 interface via ERC165", async function () {
            let interfaceID = "0x5b5e139f";
            expect(await nftContract.supportsInterface(interfaceID)).to.equal(true);
        });

        it("Smart contract should support ERC721Enumerable interface via ERC165", async function () {
            let interfaceID = "0x780e9d63";
            expect(await nftContract.supportsInterface(interfaceID)).to.equal(true);
        });

    });

    describe("SampleNFT burn", function () {

        it("A burnt token owner must be the null address", async function () {
            await nftContract.safeMint(artist1Sig.address, "")
            await nftContract.connect(artist1Sig).burn(0);

            await expect(nftContract.ownerOf(0)).to.revertedWith("ERC721: invalid token ID");
        });

        it("Burn function should revert when caller is not the owner", async function () {
            await nftContract.safeMint(artist1Sig.address, "")
            await expect(nftContract.burn(0)).to.revertedWith("ERC721: caller is not token owner or approved");
        });

    });

});