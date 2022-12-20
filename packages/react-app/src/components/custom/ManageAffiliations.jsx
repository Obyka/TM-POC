import { List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import React from "react";
import Artist from "./Artist";
export default function ManageAffiliations({
  rightHolderContractAddress,
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
  userSigner,
}) {
  let AffiliationCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneArtist",
    "ArtistContractCreated",
    localProvider,
    1,
  );

  let affiliations = AffiliationCreatedEvents.filter(eve => eve.args._rightsHolders.includes(address)).map(
    affiliation => affiliation.args._contract,
  );

  console.log(AffiliationCreatedEvents);
  return (
    <h3>
      <List
        style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}
        bordered={false}
        itemLayout="horizontal"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={affiliations}
        renderItem={item => (
          <List.Item>
            <Artist
              mainnetProvider={mainnetProvider}
              contractAddress={item}
              address={address}
              tx={tx}
              readContracts={readContracts}
              localProvider={localProvider}
              userSigner={userSigner}
            />
          </List.Item>
        )}
      />
    </h3>
  );
}
