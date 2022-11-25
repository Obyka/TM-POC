import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button, Card, Empty, List } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Address } from "../";
import VoteForm from "./VoteForm";

export default function Agreement({
  canVote,
  admin,
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
        nftTier: nftTier === 0 ? Tier.Silver : nftTier === 1 ? Tier.Gold : Tier.Platinium,
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
      setAgreementState(States.Canceled);
    } else if (RedeemableEvents.length > 0) {
      setAgreementState(States.Redeemable);
    } else if (ForSaleEvents.length > 0) {
      setAgreementState(States.ForSale);
    } else if (InitializedEvents.length > 0) {
      setAgreementState(States.Initialized);
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
    "event NewVote(address _artist, uint _royaltiesInBps, uint _ownShare, uint8 _nftTier, bool _exploitable)",
    "function getState() public view returns(State)",
    "function cancelAgreement() public",
    "function max(uint a, uint b) internal pure returns (uint)",
    "function isArtist(address artistAddress) public view returns(bool isIndeed)",
    "function newArtist(address artistAddress) internal",
    "function vote(uint royaltiesInBps, uint ownShare, uint8 nftTier, bool exploitable) external onlyArtist",
    "function putForSale() external onlyArtist",
    "function purchase() external payable",
    "function redeem() onlyArtist external",
    "function sendViaCall(address payable _to, uint _value) internal",
    "function initialize(address _collectionAddress, uint256 _tokenId, address[] memory  _artists, address _initialOwner) external",
  ];

  const contract = new ethers.Contract(contractAddress, AgreementABI, userSigner);
  contract.on("Init", () => {
    console.log("CONTRACT STATE -- INIT");
    setAgreementState(States.Initialized);
  });
  contract.on("ForSale", _price => {
    console.log("CONTRACT STATE -- FORSALE");
    setAgreementState(States.ForSale);
  });
  contract.on("Purchase", (_buyer, _value) => {
    console.log("CONTRACT STATE -- PURCHASE");
  });
  contract.on("Redeem", (_artist, _value) => {
    console.log("CONTRACT STATE -- REDEEM");
    setAgreementState(States.Redeemable);
  });
  contract.on("Canceled", _admin => {
    console.log("CONTRACT STATE -- CANCELED");
    setAgreementState(States.Canceled);
  });
  contract.on("NewVote", (_artist, _royaltiesInBps, _ownShare, _nftTier, _exploitable) => {
    console.log("CONTRACT STATE -- NEWVOTE");
    updateArtistsVoteMap(_artist, {
      royaltiesInBps: _royaltiesInBps,
      ownShare: _ownShare,
      nftTier: _nftTier === 0 ? Tier.Silver : _nftTier === 1 ? Tier.Gold : Tier.Platinium,
      exploitable: _exploitable,
    });
  });

  let agreementsAddresses = AgreementsCreatedEvents.map(elem => elem.args._contract);
  const States = {
    Uninitialized: "Uninitialized",
    Initialized: "Initialized",
    ForSale: "Sale is open",
    Redeemable: "Redeemable",
    Canceled: "Canceled",
  };
  const Tier = {
    Silver: "Silver",
    Gold: "Gold",
    Platinium: "Platinium",
  };

  const [agreementState, setAgreementState] = useState(States.Uninitialized);
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
          {States[agreementState]}
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
                          <li>Royalties: {artistsVoteMap.get(item).royaltiesInBps.toNumber() / 100}% </li>
                          <li>Own share {artistsVoteMap.get(item).ownShare.toNumber() / 100}%</li>
                          <li>NFT Tier {artistsVoteMap.get(item).nftTier}</li>
                          <li>
                            Commercially exploitable{" "}
                            {artistsVoteMap.get(item).exploitable ? <CheckOutlined /> : <CloseOutlined />}
                          </li>
                        </ul>
                      )}
                    </>
                  }
                />
              </List.Item>
            )}
          />
          {admin && agreementState !== States.Canceled && (
            <List.Item>
              <Button
                onClick={async () => {
                  let tx = await contract.cancelAgreement();
                }}
              >
                Cancel agreement
              </Button>
            </List.Item>
          )}
          {canVote && agreementState !== States.Canceled && <VoteForm tx={tx} agreementContract={contract} />}
        </>
      ) : (
        <Empty description="No agreement at this address" />
      )}
    </Card>
  );
}