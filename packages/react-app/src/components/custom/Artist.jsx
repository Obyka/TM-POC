import { Card, Empty, List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { Address } from "../";
import PreconditionsForm from "./PreconditionsForm";
export const ArtistABI = [
  "event Init(address indexed _artist, address[] _rightsHolders, uint[] _sharesInBPS)",
  "event Received(address from, uint amount)",
  "event Withdraw(address to, uint amount)",
  "function initialize(address[] memory _rightsHolders, uint[] memory _shares) external",
  "function setRightsHolders(address[] memory _rightsHolders, uint[] memory _shares) internal",
  "function isRightsHolder(address rightsHolderAddress) public view returns (bool isIndeed)",
  "function setPreconditions(uint _minimalRoyaltiesInBps, uint _minimalTier) external",
  "function splitPayment(uint amount) internal",
  "function withdraw() public",
  "function sendViaCall(address payable _to, uint _value) internal",
  "event AffiliationCreated(address artistContract, address rightHolderContract, uint rightsHoldersSharesInBPS)",
];
export default function Artist({
  mainnetProvider,
  contractAddress,
  address,
  tx,
  readContracts,
  localProvider,
  userSigner,
}) {
  async function deriveAffiliationsFromEvents() {
    let Affiliations = contract.filters.Init();
    let AffiliationsEvents = await contract.queryFilter(Affiliations, 0);
    console.log(`Events ${JSON.stringify(contract.address)}`);

    // Usually, only one event must occur
    AffiliationsEvents.forEach(elem => {
      console.log(`Elem ${JSON.stringify(elem)}`);
      elem.args[1].forEach((rightsHolder, index) => {
        const share = elem.args[2][index];
        updateAffiliationMap(rightsHolder, share);
      });
    });
  }

  const updateAffiliationMap = (k, v) => {
    setAffiliationsMap(new Map(affiliationsMap.set(k, v)));
  };

  let ArtistCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneArtist",
    "ArtistContractCreated",
    localProvider,
    1,
  );

  let artistsAddresses = ArtistCreatedEvents.map(elem => elem.args._contract);

  const contract = new ethers.Contract(contractAddress, ArtistABI, userSigner);

  const [affiliationsMap, setAffiliationsMap] = useState(new Map());
  useEffect(() => {
    deriveAffiliationsFromEvents();
  }, []);

  return (
    <Card
      style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}
      bordered={false}
      title={
        <>
          Artist <Address address={contractAddress} ensProvider={mainnetProvider} fontSize={15} />
        </>
      }
      style={{ margin: "auto", marginTop: 0, marginLeft: 0, marginRight: 0, width: "100%" }}
    >
      {artistsAddresses.includes(contractAddress) ? (
        <>
          <List
            bordered={false}
            itemLayout="vertical"
            rowKey={item => `${item}`}
            dataSource={Array.from(affiliationsMap.keys())}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={<Address address={item} ensProvider={mainnetProvider} fontSize={15} />}
                  description={<>Share: {affiliationsMap.get(item).toNumber() / 100}%</>}
                />
              </List.Item>
            )}
          />
          <PreconditionsForm tx={tx} artistContract={contract} />
        </>
      ) : (
        <Empty description="No artist contract at this address" />
      )}
    </Card>
  );
}
