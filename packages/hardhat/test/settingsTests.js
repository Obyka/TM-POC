const { ethers } = require("hardhat");
const { expect } = require("chai");


describe("Settings tests", function () {
  //const { deployer, rightsholder1, rightsholder2, artist1, artist2, admin1, buyer1 } = await getNamedAccounts();

  let settingsContract;
  let nftContract;

  beforeEach(async () => {
    const SampleNFTContract = await ethers.getContractFactory("SampleNFT");
    nftContract = await SampleNFTContract.deploy("");

    const SettingsContract = await ethers.getContractFactory("Settings");
    settingsContract = await SettingsContract.deploy(nftContract.address);
  });

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  describe("Settings deployment", function () {
    it("Should deploy Settings contract", async function () {
    });

    it("Should revert when collection address is null", async function () {
      const SettingsContract = await ethers.getContractFactory("Settings");
      await expect(SettingsContract.deploy(ethers.constants.AddressZero)).to.be.revertedWith("Null address");

    });


    describe("Events", function () {
      it("Should emit UpdateFeeAmount event with args when value is updated", async function () {
        await expect(settingsContract
          .setFeeAmount(10))
          .to.emit(settingsContract, 'UpdateFeeAmount')
          .withArgs(500, 10);

      });

      it("Should emit UpdateFeeReceiver event with args when value is updated", async function () {
        await expect(settingsContract
          .setFeeReceiver("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"))
          .to.emit(settingsContract, 'UpdateFeeReceiver')
          .withArgs("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
      });

      it("Should emit UpdateAdministrator event with args when value is updated", async function () {
        await expect(settingsContract
          .setAdministrator("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"))
          .to.emit(settingsContract, 'UpdateAdministrator')
          .withArgs("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
      });

      it("Should emit UpdateTierPrices event with args when value is updated", async function () {
        await expect(settingsContract
          .setTierPrices(["0.2", "0.3", "0.4"].map((elem) => ethers.utils.parseEther(elem))))
          .to.emit(settingsContract, 'UpdateTierPrices')
          .withArgs(["0.1", "0.2", "0.4"].map((elem) => ethers.utils.parseEther(elem)),
            ["0.2", "0.3", "0.4"].map((elem) => ethers.utils.parseEther(elem)));

      });

      it("Should emit UpdateCollectionAddress event with args when value is updated", async function () {
        await expect(settingsContract
          .setCollectionAddress("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"))
          .to.emit(settingsContract, 'UpdateCollectionAddress')
          .withArgs(nftContract.address, "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
      
      });
    });


    describe("Settings values", function () {
      it("Should return initial values", async function () {
        const feeAmount = 500;
        const deployer = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        const feeReceiver = deployer;
        const administrator = deployer;
        const tierPrices = ["0.1", "0.2", "0.4"].map((elem) => ethers.utils.parseEther(elem));

        expect(await settingsContract.feeAmount()).to.equal(feeAmount);
        expect(await settingsContract.feeReceiver()).to.equal(feeReceiver);
        expect(await settingsContract.administrator()).to.equal(administrator);
        expect(await settingsContract.getTierPrices()).to.eql(tierPrices);

      });

      it("Should return modified values", async function () {
        const feeAmount = 600;
        const deployer = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
        const feeReceiver = deployer;
        const administrator = deployer;
        const tierPrices = ["0.2", "0.3", "0.4"].map((elem) => ethers.utils.parseEther(elem));

        await settingsContract.setFeeAmount(feeAmount)
        await settingsContract.setFeeReceiver(feeReceiver)
        await settingsContract.setAdministrator(administrator)
        await settingsContract.setTierPrices(tierPrices)

        expect(await settingsContract.feeAmount()).to.equal(600);
        expect(await settingsContract.feeReceiver()).to.equal("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
        expect(await settingsContract.administrator()).to.equal("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
        expect(await settingsContract.getTierPrices()).to.eql(tierPrices);

      });
    });

    describe("Settings errors", function () {
      it("Should revert when new values are bigger than max", async function () {
        const maxFeeAmount = await settingsContract.maxFeeAmount();
        const maxSilverPrice = await settingsContract.maxTierPrices(0);
        const maxGoldPrice = await settingsContract.maxTierPrices(1);
        const maxPlatiniumPrice = await settingsContract.maxTierPrices(2);
        const maxTierPrices = [maxSilverPrice, maxGoldPrice, maxPlatiniumPrice]


        await expect(settingsContract.setFeeAmount(maxFeeAmount + 1)).to.be.revertedWith('Fee greater than max');
        await expect(settingsContract.setTierPrices(maxTierPrices.map(elem => elem + 1))).to.be.revertedWith('Price greater than max');

      });

      it("Should revert when new address values are invalid", async function () {

        await expect(settingsContract.setAdministrator(ethers.constants.AddressZero)).to.be.revertedWith("Null address");
        await expect(settingsContract.setFeeReceiver(ethers.constants.AddressZero)).to.be.revertedWith("Null address");
        await expect(settingsContract.setCollectionAddress(ethers.constants.AddressZero)).to.be.revertedWith("Null address");

      });
    });
  });
});
