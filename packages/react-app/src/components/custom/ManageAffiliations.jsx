import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { Button, Card, List } from "antd";
import { AddressInput, Address, Balance, Events } from "../";
import { useEventListener } from "eth-hooks/events/useEventListener";
import Artist from "./Artist";
import { local } from "web3modal";
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

  let AffiliationCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneArtist",
    "ArtistContractCreated",
    localProvider,
    1,
  );

  console.log(`ADDRESS: ${address}`);
  let affiliations = AffiliationCreatedEvents.filter(eve => eve.args._rightsHolders.includes(address)).map(
    affiliation => affiliation.args._contract,
  );

  console.log(AffiliationCreatedEvents);
  return (
    <Card title={"Affiliated artists"} style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <List
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
    </Card>
  );
}
