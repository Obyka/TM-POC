// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

const AgreementABI = [
    "event Init(address _collectionAddress, uint256 _tokenId, address[] _artists, address _initialOwner)",
    "event TierProposition(address indexed _artist, uint _value)",
    "event ForSale(uint _price)",
    "event Purchase(address indexed _buyer, uint _value)",
    "event Redeem(address indexed _artist, uint _value)",
    "event Canceled(address admin)",
    "event NewVote(address _artist, uint _royaltiesInBps, uint _ownShare, uint8 _nftTier, bool _exploitable)",
    "function getState() public view returns(State)",
    "function cancelAgreement() public",
    "function isArtist(address artistAddress) public view returns(bool isIndeed)",
    "function vote(uint _royaltiesInBps,uint _ownShareInBps,uint8 _nftTier,bool _exploitable,address _voter) external",
    "function putForSale() external",
    "function purchase() external payable",
    "function redeem(address _adhesion) external",
    "function initialize(address _collectionAddress, uint256 _tokenId, address[] memory  _artists, address _initialOwner) external",
    "function getRedeemableAmount() public view returns (uint reedemableAmount)",
];

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer, rightsholder1, rightsholder2, artist1, artist2, admin1, buyer1 } = await getNamedAccounts();
    const chainId = await getChainId();

    const rightsholder1Sig = await ethers.getNamedSigner("rightsholder1")
    const rightsholder2Sig = await ethers.getNamedSigner("rightsholder2")
    const artist1Sig = await ethers.getNamedSigner("artist1")
    const artist2Sig = await ethers.getNamedSigner("artist2")
    const admin1Sig = await ethers.getNamedSigner("admin1")
    const buyer1Sig = await ethers.getNamedSigner("buyer1")


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

    const rightHolders = [rightsholder1, rightsholder2]
    const shares = [4000, 4000]

    // Création des contrats d'adhésion
    await FactoryCloneArtist.connect(artist1Sig).createArtist(rightHolders, shares);
    await FactoryCloneArtist.connect(artist2Sig).createArtist(rightHolders, shares);

    // Création du contrat NFT
    const ipfsHash = "QmQ4prYiFAg1aWe6GVAyoX1AUwvhbYrVP9YmER8xA7jvAn"
    const result = await SampleNFT.connect(artist1Sig).safeMint(artist1, `ipfs://${ipfsHash}`);

    const receipt = await result.wait();
    // TokenID
    // https://github.com/scaffold-eth/scaffold-eth-examples/blob/merkler/packages/react-app/src/views/NewMerkler.jsx
    let tokenID = receipt.events[0].args[2]
    console.log(`Minted tokenID ${tokenID}`);

    // Prédiction et création de l'agreement
    const randomNumberSalt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const implementationAddress = await FactoryCloneAgreement.agreementImpl();

    console.log(
        `Salt: ${randomNumberSalt}\n Impl. Address: ${implementationAddress}\n Address: ${artist1}`,
    );
    const predictAddress = await FactoryCloneAgreement.predictDeterministicAddress(
        implementationAddress,
        randomNumberSalt,
        artist1,
    )

    console.log(`Predicted address ${predictAddress}`)

    // Approve du contrat Agreement pour le tokenID
    await SampleNFT.connect(artist1Sig).approve(predictAddress, tokenID)

    // Création de l'agreement entre artist1 et artist2
    const createdAgreement = await FactoryCloneAgreement.connect(artist1Sig).createAgreement([artist1, artist2], SampleNFT.address, tokenID, randomNumberSalt)
    let agreementReceipt = await createdAgreement.wait()

    const cloneAgreementContract = new ethers.Contract(predictAddress, AgreementABI);

    // Votes de artist1 et artist2
    const artist1Contract = await FactoryCloneArtist.connect(artist1Sig).artistToContract(artist1);
    const artist2Contract = await FactoryCloneArtist.connect(artist2Sig).artistToContract(artist2);

    await cloneAgreementContract.connect(artist1Sig).vote(1000, 1000, 2, true, artist1Contract)
    await cloneAgreementContract.connect(artist2Sig).vote(1000, 1000, 2, false, artist2Contract)

    // Mise en vente de l'agreement
    const putForSale = await cloneAgreementContract.connect(artist1Sig).putForSale()
    const receiptPutForSale = await putForSale.wait();
    const nftPrice = receiptPutForSale.events[0].args._price

    // Achat du NFT par NFTBuyer
    const options = { value: nftPrice}
    await cloneAgreementContract.connect(buyer1Sig).purchase(options)

    // Redeem par les deux artistes
    await cloneAgreementContract.connect(artist1Sig).redeem(artist1Contract)
    await cloneAgreementContract.connect(artist2Sig).redeem(artist2Contract)



};
module.exports.tags = ["run"];
