import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { Button, Card, List } from "antd";
import { AddressInput, Address, Balance, Events } from "..";
import { useEventListener } from "eth-hooks/events/useEventListener";
export default function ManageAgreements({
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

  //    event AgreementCreated(address[] indexed _coArtists, address _contract);

  let AgreementsCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneAgreement",
    "AgreementCreated",
    localProvider,
    1,
  );
  console.log(AgreementsCreatedEvents);
  return (
    <Card title={"Ongoins agreements"} style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <List
        bordered={true}
        itemLayout="horizontal"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={AgreementsCreatedEvents}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={
                <>
                  Agreement's address{" "}
                  <Address address={item.args._contract} ensProvider={mainnetProvider} fontSize={15} />
                </>
              }
              description={
                <>
                  Co-artists:{" "}
                  <ul>
                    {item.args._coArtists.map(artist => (
                      <li>
                        <Address address={artist} ensProvider={mainnetProvider} fontSize={15} />
                      </li>
                    ))}
                  </ul>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
