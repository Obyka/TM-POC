import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { Button, Card, List } from "antd";
import { AddressInput, Address, Balance, Events } from "../";
import { useEventListener } from "eth-hooks/events/useEventListener";
export default function ManageAffiliations({
  rightHolderContractAddress,
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
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
  console.log(AffiliationCreatedEvents);
  return (
    <Card title={"Affiliated artists"} style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <h3>Your contract address</h3>
      <Address address={rightHolderContractAddress} ensProvider={mainnetProvider} fontSize={15} />

      <List
        bordered={true}
        itemLayout="horizontal"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={AffiliationCreatedEvents.filter(eve =>
          eve.args._rightsHolders.includes(rightHolderContractAddress),
        )}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={
                <>
                  Artist's contract{" "}
                  <Address address={item.args._contract} ensProvider={mainnetProvider} fontSize={15} />
                </>
              }
              description={`Your share of total revenue is: ${
                item.args._sharesInBPS[item.args._rightsHolders.findIndex(elem => elem == rightHolderContractAddress)]
              }%`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
