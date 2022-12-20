import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button, Card, Empty, List } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Address } from "../";
import VoteForm from "./VoteForm";
import { updateNotif } from "../../helpers/helperFunctions.jsx";
export const States = {
  Uninitialized: "Uninitialized",
  Initialized: "Initialized",
  ForSale: "Sale is open",
  Redeemable: "Redeemable",
  Canceled: "Canceled",
};

export const AgreementABI = [
  "event Init(address _collectionAddress,uint256 _tokenId,address[] _artists,address _initialOwner)",
  "event VoteResult(uint __royaltiesInBps, uint _nftTier, bool _exploitable)",
  "event ForSale(uint _price)",
  "event Purchase(address indexed _buyer, uint _value)",
  "event Redeem(address indexed _artist, uint _value)",
  "event Canceled(address admin)",
  "event NewVote(address _artist,uint _royaltiesInBps,uint _ownShare,uint _nftTier,bool _exploitable)",
  "function initialize(uint256 _tokenId,address[] memory _artists,address _initialOwner,address _settings) external",
  "function getBalance() external view returns (uint _balance)",
  "function purchase() external payable",
  "function getState() public view returns (uint)",
  "function cancelAgreement() public",
  "function redeem_artist(address _adhesion) external",
  "function redeem_tyxit() external",
  "function isArtist(address artistAddress) public view returns (bool isIndeed)",
  "function putForSale() external",
  "function vote(uint _royaltiesInBps,uint _ownShareInBps,uint8 _nftTier,bool _exploitable,address _voter) external",
];

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
    console.log(`Vote event ${JSON.stringify(VoteEvents)}`);

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

  async function deriveArtistsFromEvents() {
    let Initialized = contract.filters.Init();
    let InitializedEvents = await contract.queryFilter(Initialized, 0);
    let artists = InitializedEvents[0].args.slice(2, -1)[0];
    setArtistsState(artists);
  }

  async function deriveStateFromEvents() {
    let Initialized = contract.filters.Init();
    let ForSale = contract.filters.ForSale();
    let Purchase = contract.filters.Purchase();
    let Redeemable = contract.filters.Redeem();
    let Canceled = contract.filters.Canceled();

    let CanceledEvents = await contract.queryFilter(Canceled, 0);
    let RedeemableEvents = await contract.queryFilter(Redeemable, 0);
    let PurchaseEvents = await contract.queryFilter(Purchase, 0);
    let ForSaleEvents = await contract.queryFilter(ForSale, 0);
    let InitializedEvents = await contract.queryFilter(Initialized, 0);

    if (CanceledEvents.length > 0) {
      setAgreementState(States.Canceled);
    } else if (RedeemableEvents.length > 0) {
      setAgreementState(States.Redeemable);
    } else if (PurchaseEvents.length > 0) {
      setRedeemAmount(await contract.getBalance());
      setAgreementState(States.Redeemable);
    } else if (ForSaleEvents.length > 0) {
      setAgreementState(States.ForSale);
    } else if (InitializedEvents.length > 0) {
      setAgreementState(States.Initialized);
    }
  }

  let AgreementsCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneAgreement",
    "AgreementCreated",
    localProvider,
    1,
  );

  const contract = new ethers.Contract(contractAddress, AgreementABI, userSigner);

  let agreementsAddresses = AgreementsCreatedEvents.map(elem => elem.args._contract);

  const Tier = {
    Silver: "Silver",
    Gold: "Gold",
    Platinium: "Platinium",
  };

  const [agreementState, setAgreementState] = useState(States.Uninitialized);
  const [artistsState, setArtistsState] = useState([]);
  const [artistsVoteMap, setArtistsVoteMap] = useState(new Map());
  const [redeemAmount, setRedeemAmount] = useState(0);

  const updateArtistsVoteMap = (k, v) => {
    setArtistsVoteMap(new Map(artistsVoteMap.set(k, v)));
  };

  useEffect(() => {
    deriveArtistsFromEvents();
    deriveStateFromEvents();
    deriveVoteFromEvents();

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
      setAgreementState(States.Redeemable);
    });
    contract.on("Redeem", async (_artist, _value) => {
      console.log("CONTRACT STATE -- REDEEM");
      setAgreementState(States.Redeemable);
      setRedeemAmount(await contract.getBalance());
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

    console.log(`CURRENT STATE ${agreementState}`);

    return () => {
      contract.removeAllListeners();
    };
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
          {agreementState === States.Redeemable && (
            <h3> Amount to redeem: {ethers.utils.formatEther(redeemAmount)} Ξ</h3>
          )}

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
                      Performer address <Address address={item} ensProvider={mainnetProvider} fontSize={15} />
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
            <Button
              onClick={async () => {
                try {
                  tx(contract.cancelAgreement(), updateNotif);
                } catch (error) {
                  console.log(error);
                }
              }}
            >
              Cancel agreement
            </Button>
          )}

          {admin && redeemAmount > 0 && (
            <Button
              onClick={async () => {
                try {
                  tx(contract.redeem_tyxit(), updateNotif);
                } catch (error) {
                  console.log(error);
                }
              }}
            >
              Redeem your benefits
            </Button>
          )}
          {canVote && (
            <VoteForm
              redeemAmount={redeemAmount}
              agreementState={agreementState}
              readContracts={readContracts}
              address={address}
              tx={tx}
              agreementContract={contract}
            />
          )}
        </>
      ) : (
        <Empty description="No agreement at this address" />
      )}
    </Card>
  );
}
