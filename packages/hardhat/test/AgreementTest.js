const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Agreement tests", function () {

    let artist1Sig
    let artist2Sig
    let artist3Sig
    let buyer1Sig
    let rightsholder1Sig
    let rightsHolders
    let admin1
    let shares
    const TIER_VOTE_CASES =
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [1, 1, 1, 1],
            [1, 1, 2, 1],
            [1, 2, 2, 1],
            [2, 2, 2, 2]
        ]
    const ROYALTY_VOTE_CASES =
        [
            [0, 0, 0, 0],
            [0, 0, 1000, 333],
            [0, 1000, 1000, 666],
            [1000, 1000, 1000, 1000],
            [10000, 10000, 10000, 10000]
        ]
    const PURCHASE_CASE = [
        // Share1, share2, share3, shareTyxit expected1, expected2, expected3, expectedTyxit, price
        [1, 49, 50, 5, "0.00095", "0.04655", "0.0475", "0.005", "0.1", 0],
        [100, 0, 0, 5, "0.19", "0", "0", "0.01", "0.2", 1],
        [1, 1, 1, 5, "0.0038", "0.0038", "0.0038", "0.02", "0.4", 2],
    ]

    const ROYALTIES_CASE = [
        // Share1, share2, share3, shareTyxit expected1, expected2, expected3, expectedTyxit, price
        [1, 49, 50, 5, "0.00095", "0.04655", "0.0475", "0.005", "0.1", 0],
        [100, 0, 0, 5, "0.19", "0", "0", "0.01", "0.2", 1],
        [1, 1, 1, 5, "0.0038", "0.0038", "0.0038", "0.02", "0.4", 2],
        [33, 44, 23, 15, "0.00000002805", "0.0000000374", "0.00000001955", "0.000000015", "0.0000001", 2],
    ]


    async function deployContracts() {

        const SampleNFTContract = await ethers.getContractFactory("SampleNFT");
        const nftContract = await SampleNFTContract.deploy("");

        const SettingsContract = await ethers.getContractFactory("Settings");
        const settingsContract = await SettingsContract.connect(admin1).deploy(nftContract.address)

        const FactoryCloneAgreement = await ethers.getContractFactory("FactoryCloneAgreement");
        const factoryCloneAgreement = await FactoryCloneAgreement.deploy(settingsContract.address);
        const implementationAddress = await factoryCloneAgreement.agreementImpl();

        const artists = [artist1Sig.address, artist2Sig.address, artist3Sig.address]
        const tokenId = 0
        const salt1 = ethers.utils.randomBytes(32);
        const agreementAddress = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt1);

        await nftContract.connect(artist1Sig).safeMint(artist1Sig.address, "testURI");
        await nftContract.connect(artist1Sig).approve(agreementAddress, 0)
        const tx = await factoryCloneAgreement.connect(artist1Sig).createAgreement(artists, tokenId, salt1)
        const AgreementContract = await ethers.getContractFactory("Agreement");
        const agreementContract = await AgreementContract.attach(agreementAddress);

        const FactoryCloneArtist = await ethers.getContractFactory("FactoryCloneArtist");
        const factoryCloneArtist = await FactoryCloneArtist.deploy();

        await factoryCloneArtist.connect(artist1Sig).createArtist(rightsHolders, shares)
        await factoryCloneArtist.connect(artist2Sig).createArtist(rightsHolders, shares)
        await factoryCloneArtist.connect(artist3Sig).createArtist(rightsHolders, shares)

        const artist1Contract = await factoryCloneArtist.artistToContract(artist1Sig.address)
        const artist2Contract = await factoryCloneArtist.artistToContract(artist2Sig.address)
        const artist3Contract = await factoryCloneArtist.artistToContract(artist3Sig.address)

        const ArtistContract = await ethers.getContractFactory("Artist");

        const artist1contract = await ArtistContract.attach(artist1Contract);
        const artist2contract = await ArtistContract.attach(artist2Contract);
        const artist3contract = await ArtistContract.attach(artist3Contract);

        const adhesionContracts = [artist1contract, artist2contract, artist3contract]

        return { tx, factoryCloneAgreement, agreementContract, settingsContract, tokenId, salt1, artists, agreementAddress, nftContract, adhesionContracts }

    };

    before(async () => {
        artist1Sig = await ethers.getNamedSigner("artist1")
        artist2Sig = await ethers.getNamedSigner("artist2")
        artist3Sig = await ethers.getNamedSigner("rightsholder1")
        buyer1Sig = await ethers.getNamedSigner("buyer1")
        rightsholder1Sig = await ethers.getNamedSigner("rightsholder2")
        admin1 = await ethers.getNamedSigner("admin1")
        shares = [8000]
        rightsHolders = [rightsholder1Sig.address]
    })

    // quick fix to let gas reporter fetch data from gas station & coinmarketcap
    before((done) => {
        setTimeout(done, 2000);
    });

    describe("Agreement init", function () {
        it("Collection address should be set after initialization based on settings", async function () {
            const { agreementContract, settingsContract } = await loadFixture(deployContracts)
            const collectionAddressSettings = await settingsContract.collectionAddress();
            expect(await agreementContract.collectionAddress()).to.be.equal(collectionAddressSettings)
        });
        it("Initialize should revert if called more than once", async function () {
            const { agreementContract, settingsContract, tokenId, salt1, artists } = await loadFixture(deployContracts)
            await expect(agreementContract
                .initialize(tokenId, artists, artists[0], settingsContract.address))
                .to.be.revertedWith("Initializable: contract is already initialized")
        });
        it("Administrator role should be set after initialization based on settings", async function () {
            const { agreementContract, settingsContract } = await loadFixture(deployContracts)
            const administratorAddress = await settingsContract.administrator();
            const TYXIT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TYXIT_ROLE"));
            expect(await agreementContract.hasRole(TYXIT_ROLE, administratorAddress)).to.be.equal(true);
        });
        it("Initialize should revert if one or more artist address is invalid", async function () {
            const SampleNFTContract = await ethers.getContractFactory("SampleNFT");
            const nftContract = await SampleNFTContract.deploy("");

            const SettingsContract = await ethers.getContractFactory("Settings");
            const settingsContract = await SettingsContract.deploy(nftContract.address)

            const FactoryCloneAgreement = await ethers.getContractFactory("FactoryCloneAgreement");
            const factoryCloneAgreement = await FactoryCloneAgreement.deploy(settingsContract.address);
            const implementationAddress = await factoryCloneAgreement.agreementImpl();

            const artists = [artist1Sig.address, artist2Sig.address, artist3Sig.address, ethers.constants.AddressZero]
            const tokenId = 0
            const salt1 = ethers.utils.randomBytes(32);
            const agreementAddress = await factoryCloneAgreement.predictDeterministicAddress(implementationAddress, salt1);

            await nftContract.connect(artist1Sig).safeMint(artist1Sig.address, "testURI");
            await nftContract.connect(artist1Sig).approve(agreementAddress, 0)
            await expect(factoryCloneAgreement.connect(artist1Sig).createAgreement(artists, tokenId, salt1)).to.be.revertedWith("invalid artist")

        });
        it("TokenID should be owned by Agreement address after initialization", async function () {
            const { agreementContract, nftContract, tokenId } = await loadFixture(deployContracts)
            expect(await nftContract.ownerOf(tokenId)).to.be.equal(agreementContract.address);
        });

        it("Contract state should be Initialized after initialization", async function () {
            const { agreementContract } = await loadFixture(deployContracts)
            expect(await agreementContract.contractState()).to.be.equal(1);
        });

        it("Tier prices should be set after initialization based on Settings", async function () {
            const { agreementContract, settingsContract } = await loadFixture(deployContracts)
            const prices = [await agreementContract.tierPrice(0),
            await agreementContract.tierPrice(1),
            await agreementContract.tierPrice(2)]
            expect(prices).to.be.deep.equal(await settingsContract.getTierPrices());
        });

        it("Init event should be emitted", async function () {
            const { tx, agreementContract, nftContract, tokenId, artists } = await loadFixture(deployContracts)
            await expect(tx).to.deep
                .emit(agreementContract, 'Init')
                .withArgs(nftContract.address, tokenId, artists, artist1Sig.address);
        });
        it("Init should create an artist struct with correct value", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            const artistStruct = { ...await agreementContract.connect(artist1Sig).artistMapping(artist1Sig.address) };
            expect(artistStruct.hasVoted).to.be.equal(false)
            expect(artistStruct.isArtist).to.be.equal(true)
            expect(artistStruct.balance).to.be.equal(0)

        })
    })

    describe("Agreement vote", function () {
        it("Voting should revert if contract state is canceled", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(admin1).cancelAgreement()
            await expect(agreementContract.connect(artist1Sig).vote(0, 0, 0, false, adhesionContracts[0].address))
                .to.be.revertedWith("Contract not in Initialized state");
        });
        it("Voting should revert if royalties exceed 10000 (basis)", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await expect(agreementContract.connect(artist1Sig).vote(10001, 0, 0, false, adhesionContracts[0].address))
                .to.be.revertedWith("Royalties should not exceed 100 percent");
        });
        it("Voting should revert if own share exceed 10000 (basis)", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await expect(agreementContract.connect(artist1Sig).vote(0, 10001, 0, false, adhesionContracts[0].address))
                .to.be.revertedWith("Own share should not exceed 100 percent");
        });
        it("Voting should revert if tier exceed 2", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await expect(agreementContract.connect(artist1Sig).vote(0, 0, 3, false, adhesionContracts[0].address))
                .to.be.reverted;
        });
        it("Voting should revert if supplied royalties is less than artist's precondition", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await adhesionContracts[0].connect(rightsholder1Sig).setPreconditions(1000, 0)
            await expect(agreementContract.connect(artist1Sig).vote(500, 0, 0, false, adhesionContracts[0].address))
                .to.be.revertedWith("Vote is not compatible with preconditions");
        });
        it("Voting should revert if supplied tier is less than artist's precondition", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await adhesionContracts[0].connect(rightsholder1Sig).setPreconditions(0, 1)
            await expect(agreementContract.connect(artist1Sig).vote(500, 0, 0, false, adhesionContracts[0].address))
                .to.be.revertedWith("Vote is not compatible with preconditions");
        });
        it("hasVoting boolean should be set once an artist has voted", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(0, 0, 0, false, adhesionContracts[0].address)
            const artistStruct = { ...await agreementContract.connect(artist1Sig).artistMapping(artist1Sig.address) };
            expect(artistStruct.hasVoted).to.be.equal(true)
        });
        it("Vote struct in artist mapping should match supplied values ", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1234, 4321, 1, true, adhesionContracts[0].address)
            const artistStruct = { ...await agreementContract.connect(artist1Sig).artistMapping(artist1Sig.address) };
            expect(artistStruct.vote.royaltiesInBps).to.be.equal(1234)
            expect(artistStruct.vote.ownShare).to.be.equal(4321)
            expect(artistStruct.vote.nftTier).to.be.equal(1)
            expect(artistStruct.vote.exploitable).to.be.equal(true)
        });
        it("Vote should emit an event with supplied values ", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await expect(agreementContract.connect(artist1Sig)
                .vote(1234, 4321, 1, true, adhesionContracts[0].address))
                .to.emit(agreementContract, 'NewVote')
                .withArgs(artist1Sig.address, 1234, 4321, 1, true);

        });
    })
    describe("Put for sale", function () {
        it("Put for sale should revert if not every artist has voted", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await expect(agreementContract.connect(artist1Sig).putForSale())
                .to.be.revertedWith("Every artist should vote")
        });
        it("Put for sale should revert if contract state is canceled", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(admin1).cancelAgreement()
            await expect(agreementContract.connect(artist1Sig).putForSale())
                .to.be.revertedWith("Contract not in Initialized state");
        });
        it("Put for sale should revert if all shares exceed 10000 (basis)", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(0, 1, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(0, 6000, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(0, 4000, 0, true, adhesionContracts[2].address)

            await expect(agreementContract.connect(artist1Sig).putForSale())
                .to.be.revertedWith("All shares should not exceed 100%");
        });

        it("Put for sale should revert if vote result tier is less than any artist's precondition", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await adhesionContracts[0].connect(rightsholder1Sig).setPreconditions(0, 2)

            await agreementContract.connect(artist1Sig).vote(0, 0, 2, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(0, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(0, 0, 0, true, adhesionContracts[2].address)

            await expect(agreementContract.connect(artist1Sig).putForSale())
                .to.be.revertedWith("Resulting agreement terms do not respect every preconditions");
        });

        it("Put for sale should revert if vote result royalties is less than any artist's precondition", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await adhesionContracts[0].connect(rightsholder1Sig).setPreconditions(1000, 0)

            await agreementContract.connect(artist1Sig).vote(1000, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(0, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(0, 0, 0, true, adhesionContracts[2].address)

            await expect(agreementContract.connect(artist1Sig).putForSale())
                .to.be.revertedWith("Resulting agreement terms do not respect every preconditions");
        });

        it("Put for sale should set contract state to ForSale", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(0, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(0, 0, 0, true, adhesionContracts[2].address)

            await agreementContract.connect(artist1Sig).putForSale()
            expect(await agreementContract.contractState()).to.equal(2)
        });

        it("Put for sale should set NFT royalties according to vote results", async function () {
            const { adhesionContracts, agreementContract, nftContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)

            // emit VoteResult(royaltiesInBps, saleTier, exploitable);

            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const voteResultEvent = receipt.events.filter(x => x.event == "VoteResult")
            const voteResults = { ...voteResultEvent[0].args }

            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price

            const royalty = await nftContract.royaltyInfo(0, price)


            expect(royalty[1]).to.equal(ethers.BigNumber.from(voteResults.__royaltiesInBps).mul(price).div(10000))
        });

        it("Put for sale should set exploitable to false if one or more artist voted false", async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, false, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const voteResultEvent = receipt.events.filter(x => x.event == "VoteResult")
            const voteResults = { ...voteResultEvent[0].args }
            expect(voteResults._exploitable).to.be.equal(false)
        });

        it("Put for sale should set exploitable to true if every artist voted true", async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const voteResultEvent = receipt.events.filter(x => x.event == "VoteResult")
            const voteResults = { ...voteResultEvent[0].args }
            expect(voteResults._exploitable).to.be.equal(true)
        });

        TIER_VOTE_CASES.forEach((elem, index) => {
            it(`${index}) Put for sale should set sale tier to vote average with floor rounding`, async function () {
                const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

                await agreementContract.connect(artist1Sig).vote(0, 0, elem[0], true, adhesionContracts[0].address)
                await agreementContract.connect(artist2Sig).vote(0, 0, elem[1], true, adhesionContracts[1].address)
                await agreementContract.connect(artist3Sig).vote(0, 0, elem[2], true, adhesionContracts[2].address)
                const tx = await agreementContract.connect(artist1Sig).putForSale()
                const receipt = await tx.wait()
                const voteResultEvent = receipt.events.filter(x => x.event == "VoteResult")
                const voteResults = { ...voteResultEvent[0].args }
                expect(voteResults._nftTier).to.be.equal(elem[3])
            });
        }
        )

        ROYALTY_VOTE_CASES.forEach((elem, index) => {
            it(`${index}) Put for sale should set sale royalty amount to vote average with floor rounding`, async function () {
                const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

                await agreementContract.connect(artist1Sig).vote(elem[0], 0, 0, true, adhesionContracts[0].address)
                await agreementContract.connect(artist2Sig).vote(elem[1], 0, 0, true, adhesionContracts[1].address)
                await agreementContract.connect(artist3Sig).vote(elem[2], 0, 0, true, adhesionContracts[2].address)
                const tx = await agreementContract.connect(artist1Sig).putForSale()
                const receipt = await tx.wait()
                const voteResultEvent = receipt.events.filter(x => x.event == "VoteResult")
                const voteResults = { ...voteResultEvent[0].args }
                expect(voteResults.__royaltiesInBps).to.be.equal(elem[3])
            });
        }
        )

        it(`Put for sale should emit ForSale event with correct price`, async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(0, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(0, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(0, 0, 0, true, adhesionContracts[2].address)

            await expect(agreementContract.connect(artist1Sig).putForSale())
                .to.emit(agreementContract, "ForSale")
                .withArgs(ethers.utils.parseEther("0.1"))

        });

        it(`Put for sale should emit VoteResult event with correct values`, async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 1000, 1, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 1000, 1, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 1000, 1, true, adhesionContracts[2].address)

            await expect(agreementContract.connect(artist1Sig).putForSale())
                .to.emit(agreementContract, "VoteResult")
                .withArgs(1000, 1, true)

        });
    });

    describe("Purchase", function () {
        it(`Purchase should revert if message value is less than sale price`, async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 1000, 1, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 1000, 1, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 1000, 1, true, adhesionContracts[2].address)

            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: ethers.BigNumber.from(price).sub(1) }
            await expect(agreementContract.purchase(options)).to.be.revertedWith("Not enough ether sent")
        });

        it(`Purchase should execute if message value is exactly than sale price`, async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 1000, 1, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 1000, 1, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 1000, 1, true, adhesionContracts[2].address)

            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: ethers.BigNumber.from(price) }
            expect(await agreementContract.purchase(options)).to.not.be.reverted
        });
        it(`Purchase should revert if message value is greater than sale price`, async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 1000, 1, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 1000, 1, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 1000, 1, true, adhesionContracts[2].address)

            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: ethers.BigNumber.from(price).mul(2) }
            await expect(agreementContract.purchase(options)).to.be.reverted
        });
        it(`Purchase should revert if contract state is not ForSale`, async function () {
            const { adhesionContracts, agreementContract } = await loadFixture(deployContracts)
            const options = { value: ethers.utils.parseEther("10.0") }
            await expect(agreementContract.purchase(options)).to.be.revertedWith("Can not purchase yet")
            await agreementContract.connect(admin1).cancelAgreement()
            await expect(agreementContract.purchase(options)).to.be.revertedWith("Can not purchase yet")
        });
        it(`A successful Purchase should send the tokenId to the buyer`, async function () {
            const { adhesionContracts, agreementContract, nftContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 1000, 1, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 1000, 1, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 1000, 1, true, adhesionContracts[2].address)

            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: ethers.BigNumber.from(price) }

            await agreementContract.connect(buyer1Sig).purchase(options)
            expect(await nftContract.ownerOf(0)).to.be.equal(buyer1Sig.address)
        });
        it(`A successful Purchase should set the contract state to redeemable`, async function () {
            const { adhesionContracts, agreementContract, nftContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 1000, 1, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 1000, 1, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 1000, 1, true, adhesionContracts[2].address)

            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: ethers.BigNumber.from(price) }

            await agreementContract.connect(buyer1Sig).purchase(options)
            expect(await agreementContract.contractState()).to.be.equal(3)
        });
        it(`A successful Purchase should emit a Purchase event`, async function () {
            const { adhesionContracts, agreementContract, nftContract } = await loadFixture(deployContracts)

            await agreementContract.connect(artist1Sig).vote(1000, 1000, 1, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 1000, 1, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 1000, 1, true, adhesionContracts[2].address)

            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: ethers.BigNumber.from(price) }

            await expect(agreementContract.connect(buyer1Sig).purchase(options))
                .to.emit(agreementContract, "Purchase")
                .withArgs(buyer1Sig.address, price)
        });
    });

    describe("splitEther", function () {
        PURCHASE_CASE.forEach((elem) => {
            //  Share1, share2, share3, shareTyxit expected1, expected2, expected3, expectedTyxit, price

            it(`A purchase should be split according to shares.`, async function () {
                //feeAmount
                const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
                await settingsContract.setFeeAmount(elem[3] * 100)
                await agreementContract.connect(artist1Sig).vote(1000, elem[0] * 100, elem[9], true, adhesionContracts[0].address)
                await agreementContract.connect(artist2Sig).vote(1000, elem[1] * 100, elem[9], true, adhesionContracts[1].address)
                await agreementContract.connect(artist3Sig).vote(1000, elem[2] * 100, elem[9], true, adhesionContracts[2].address)
                const tx = await agreementContract.connect(artist1Sig).putForSale()
                const receipt = await tx.wait()
                const options = { value: ethers.utils.parseEther(elem[8]) }

                agreementContract.connect(buyer1Sig).purchase(options)
                const artist1Struct = { ...await agreementContract.connect(artist1Sig).artistMapping(artist1Sig.address) };
                const artist2Struct = { ...await agreementContract.connect(artist2Sig).artistMapping(artist2Sig.address) };
                const artist3Struct = { ...await agreementContract.connect(artist3Sig).artistMapping(artist3Sig.address) };
                const tyxitBalance = await agreementContract.connect(artist1Sig).tyxitBalance();
                expect(artist1Struct.balance).to.be.equal(ethers.utils.parseEther(elem[4]))
                expect(artist2Struct.balance).to.be.equal(ethers.utils.parseEther(elem[5]))
                expect(artist3Struct.balance).to.be.equal(ethers.utils.parseEther(elem[6]))
                expect(tyxitBalance).to.be.equal(ethers.utils.parseEther(elem[7]))
            });
        })
        ROYALTIES_CASE.forEach((elem) => {
            it(`Royalties (fallback function) should be split according to shares`, async function () {
                const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
                await settingsContract.setFeeAmount(elem[3] * 100)
                await agreementContract.connect(artist1Sig).vote(1000, elem[0] * 100, elem[9], true, adhesionContracts[0].address)
                await agreementContract.connect(artist2Sig).vote(1000, elem[1] * 100, elem[9], true, adhesionContracts[1].address)
                await agreementContract.connect(artist3Sig).vote(1000, elem[2] * 100, elem[9], true, adhesionContracts[2].address)
                const tx = await agreementContract.connect(artist1Sig).putForSale()
                const receipt = await tx.wait()
                const txRoyalties = {
                    to: agreementContract.address,
                    value: ethers.utils.parseEther(elem[8])
                };

                await buyer1Sig.sendTransaction(txRoyalties)
                const artist1Struct = { ...await agreementContract.connect(artist1Sig).artistMapping(artist1Sig.address) };
                const artist2Struct = { ...await agreementContract.connect(artist2Sig).artistMapping(artist2Sig.address) };
                const artist3Struct = { ...await agreementContract.connect(artist3Sig).artistMapping(artist3Sig.address) };
                const tyxitBalance = await agreementContract.connect(artist1Sig).tyxitBalance();

                expect(artist1Struct.balance).to.be.equal(ethers.utils.parseEther(elem[4]))
                expect(artist2Struct.balance).to.be.equal(ethers.utils.parseEther(elem[5]))
                expect(artist3Struct.balance).to.be.equal(ethers.utils.parseEther(elem[6]))
                expect(tyxitBalance).to.be.equal(ethers.utils.parseEther(elem[7]))
            });
        });
    });


    describe("Redeem", function () {
        it("Redeem_artist should revert if contract state is not Redeemable or Canceled", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await expect(agreementContract.connect(artist1Sig).redeem_artist(adhesionContracts[0].address))
                .to.be.revertedWith("Contract not in Redeemable or Canceled state")

            await agreementContract.connect(artist1Sig).vote(1000, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            await expect(agreementContract.connect(artist1Sig).redeem_artist(adhesionContracts[0].address))
                .to.be.revertedWith("Contract not in Redeemable or Canceled state")
        });

        it("Redeem_artist should emit Redeem event with correct values", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await expect(agreementContract.connect(artist1Sig)
                .redeem_artist(adhesionContracts[0].address))
                .to.emit(agreementContract, "Redeem")
                .withArgs(artist1Sig.address, ethers.utils.parseEther("0.095"))
        });

        it("Redeem_artist should revert if adhesion contract is not valid ", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await expect(agreementContract.connect(artist1Sig)
                .redeem_artist(adhesionContracts[1].address))
                .to.be.revertedWith("Sender is not the owner of supplied voter contract")
        });

        it("Redeem_artist should set artist balance to 0", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await agreementContract.connect(artist1Sig)
                .redeem_artist(adhesionContracts[0].address)

            const artist1Struct = { ...await agreementContract.connect(artist1Sig).artistMapping(artist1Sig.address) };
            expect(artist1Struct.balance).to.be.equal(0)
        });

        it("Redeem_artist should send ether to artist address", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await expect(agreementContract.connect(artist1Sig)
                .redeem_artist(adhesionContracts[0].address)
            ).to.changeEtherBalance(adhesionContracts[0], ethers.utils.parseEther("0.095"));
        });

        it("Redeem_tyxit should revert if msg.sender is not feeReceiver based on settings ", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await expect(agreementContract.connect(artist1Sig)
                .redeem_tyxit())
                .to.be.revertedWith("Caller is not fee receiver")
        });

        it("Redeem_tyxit should set tyxit balance to 0", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await agreementContract
                .connect(admin1)
                .redeem_tyxit()

            expect(await agreementContract.tyxitBalance()).to.be.equal(0)
        });

        it("Redeem_tyxit should emit Redeem event with correct values", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await expect(agreementContract
                .connect(admin1)
                .redeem_tyxit())
                .to.emit(agreementContract, "Redeem")
                .withArgs(admin1.address, ethers.utils.parseEther("0.005"))
        });

        it("Redeem_tyxit should send ether to fee receiver address", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await agreementContract.connect(artist1Sig).vote(1000, 100 * 100, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            const receipt = await tx.wait()
            const forSaleEvent = receipt.events.filter(x => x.event == "ForSale")
            const price = { ...forSaleEvent[0].args }._price
            const options = { value: price }
            await agreementContract.connect(buyer1Sig).purchase(options)

            await expect(agreementContract.connect(admin1)
                .redeem_tyxit()
            ).to.changeEtherBalance(admin1, ethers.utils.parseEther("0.005"));
        });

        it("Redeem_tyxit should revert if contract state is not Redeemable or Canceled", async function () {
            const { adhesionContracts, agreementContract, settingsContract } = await loadFixture(deployContracts)
            await expect(agreementContract.connect(admin1).redeem_tyxit())
                .to.be.revertedWith("Contract not in Redeemable or Canceled state")

            await agreementContract.connect(artist1Sig).vote(1000, 0, 0, true, adhesionContracts[0].address)
            await agreementContract.connect(artist2Sig).vote(1000, 0, 0, true, adhesionContracts[1].address)
            await agreementContract.connect(artist3Sig).vote(1000, 0, 0, true, adhesionContracts[2].address)
            const tx = await agreementContract.connect(artist1Sig).putForSale()
            await expect(agreementContract.connect(admin1).redeem_tyxit())
                .to.be.revertedWith("Contract not in Redeemable or Canceled state")
        });
    });

});
