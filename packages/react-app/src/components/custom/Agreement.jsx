import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button, Card, Empty, List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Address } from "../";
import externalContracts from "../../contracts/external_contracts";

export default function Agreement({
  mainnetProvider,
  contractAddress,
  address,
  tx,
  readContracts,
  localProvider,
  userSigner,
}) {
  async function deriveVoteFromEvents() {
    let Votes = contract.filters.NewVote();
    let VoteEvents = await contract.queryFilter(Votes, 0);
    VoteEvents.forEach(elem => {
      const artist = elem.args[0];
      const royaltiesInBps = elem.args[1];
      const ownShare = elem.args[2];
      const nftTier = elem.args[3];
      const exploitable = elem.args[4];
      updateArtistsVoteMap(artist, {
        royaltiesInBps: royaltiesInBps,
        ownShare: ownShare,
        nftTier: nftTier,
        exploitable: exploitable,
      });
    });
  }

  //event NewVote(address _artist, uint _royaltiesInBps, uint _ownShare, Tier _nftTier, bool _exploitable);
  async function deriveArtistsFromEvents() {
    let Initialized = contract.filters.Init();
    let InitializedEvents = await contract.queryFilter(Initialized, 0);
    let artists = InitializedEvents[0].args.slice(2, -1)[0];
    setArtistsState(artists);
  }

  async function deriveStateFromEvents() {
    let Initialized = contract.filters.Init();
    let ForSale = contract.filters.ForSale();
    let Redeemable = contract.filters.Redeem();
    let Canceled = contract.filters.Canceled();

    let CanceledEvents = await contract.queryFilter(Canceled, 0);
    let RedeemableEvents = await contract.queryFilter(Redeemable, 0);
    let ForSaleEvents = await contract.queryFilter(ForSale, 0);
    let InitializedEvents = await contract.queryFilter(Initialized, 0);

    if (CanceledEvents.length > 0) {
      setAgreementState("Canceled");
    } else if (RedeemableEvents.length > 0) {
      setAgreementState("Redeemable");
    } else if (ForSaleEvents.length > 0) {
      setAgreementState("For sale");
    } else if (InitializedEvents.length > 0) {
      setAgreementState("Initialized");
    }
  }
  function updateNotif(update) {
    console.log("📡 Transaction Update:", update);
    if (update && (update.status === "confirmed" || update.status === 1)) {
      console.log(" 🍾 Transaction " + update.hash + " finished!");
      console.log(
        " ⛽️ " +
          update.gasUsed +
          "/" +
          (update.gasLimit || update.gas) +
          " @ " +
          parseFloat(update.gasPrice) / 1000000000 +
          " gwei",
      );
    }
  }

  let AgreementsCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneAgreement",
    "AgreementCreated",
    localProvider,
    1,
  );

  const AgreementABI = [
    "event Init(address _collectionAddress, uint256 _tokenId, address[] _artists, address _initialOwner)",
    "event TierProposition(address indexed _artist, uint _value)",
    "event ForSale(uint _price)",
    "event Purchase(address indexed _buyer, uint _value)",
    "event Redeem(address indexed _artist, uint _value)",
    "event Canceled(address admin)",
    "event NewVote(address _artist, uint _royaltiesInBps, uint _ownShare, Tier _nftTier, bool _exploitable)",
    "function getState() public view returns(State)",
    "function cancelAgreement() public",
    "function max(uint a, uint b) internal pure returns (uint)",
    "function isArtist(address artistAddress) public view returns(bool isIndeed)",
    "function newArtist(address artistAddress) internal",
    "function vote(uint royaltiesInBps, uint ownShare, Tier nftTier, bool exploitable) external onlyArtist",
    "function putForSale() external onlyArtist",
    "function purchase() external payable",
    "function redeem() onlyArtist external",
    "function sendViaCall(address payable _to, uint _value) internal",
    "function initialize(address _collectionAddress, uint256 _tokenId, address[] memory  _artists, address _initialOwner) external",
  ];
  /*event Init();
        event ForSale(uint _price);
        event Purchase(address indexed _buyer, uint _value);
        event Redeem(address indexed _artist, uint _value);
        event Canceled(address admin);
        event NewVote(address _artist, uint _royaltiesInBps, uint _ownShare, Tier _nftTier, bool _exploitable);
    */

  const contract = new ethers.Contract(contractAddress, AgreementABI, userSigner);
  contract.on("Init", () => {
    console.log("CONTRACT STATE -- INIT");
  });
  contract.on("ForSale", _price => {
    console.log("CONTRACT STATE -- FORSALE");
  });
  contract.on("Purchase", (_buyer, _value) => {
    console.log("CONTRACT STATE -- PURCHASE");
  });
  contract.on("Redeem", (_artist, _value) => {
    console.log("CONTRACT STATE -- REDEEM");
  });
  contract.on("Canceled", _admin => {
    console.log("CONTRACT STATE -- CANCELED");
  });
  contract.on("NewVote", (_artist, _royaltiesInBps, _ownShare, _nftTier, _exploitable) => {
    console.log("CONTRACT STATE -- NEWVOTE");
    updateArtistsVoteMap(_artist, {
      royaltiesInBps: _royaltiesInBps,
      ownShare: _ownShare,
      nftTier: _nftTier,
      exploitable: _exploitable,
    });
  });

  let agreementsAddresses = AgreementsCreatedEvents.map(elem => elem.args._contract);
  const states = ["Uninitialized", "Initialized", "Sale open", "Redeemable", "Canceled"];

  const [agreementState, setAgreementState] = useState("");
  const [artistsState, setArtistsState] = useState([]);
  const [artistsVoteMap, setArtistsVoteMap] = useState(new Map());
  const updateArtistsVoteMap = (k, v) => {
    setArtistsVoteMap(new Map(artistsVoteMap.set(k, v)));
  };

  useEffect(async () => {
    deriveArtistsFromEvents();
    deriveStateFromEvents();
    deriveVoteFromEvents();
  }, []);
  return (
    <Card
      title={
        <>
          Agreement at <Address address={contractAddress} ensProvider={mainnetProvider} fontSize={15} />
        </>
      }
      style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}
    >
      {agreementsAddresses.includes(contractAddress) ? (
        <>
          {agreementState}
          <List
            bordered={false}
            itemLayout="vertical"
            rowKey={item => `${item}`}
            dataSource={artistsState}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <>
                      Artist address <Address address={item} ensProvider={mainnetProvider} fontSize={15} />
                    </>
                  }
                  description={
                    <>
                      Has voted ? {artistsVoteMap.has(item) ? "Yes" : "No"}
                      {artistsVoteMap.has(item) && (
                        <ul>
                          <li>Royalties: </li>
                          <li>Own share</li>
                          <li>NFT Tier</li>
                          <li>Commercially exploitable</li>
                        </ul>
                      )}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </>
      ) : (
        <Empty description="No agreement at this address" />
      )}
    </Card>
  );
}
