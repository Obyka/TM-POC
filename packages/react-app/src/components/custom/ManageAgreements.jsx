import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button, Card, List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Address } from "../";
import Agreement from "./Agreement";
export default function ManageAgreements({
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

  let AgreementsCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneAgreement",
    "AgreementCreated",
    localProvider,
    1,
  );

  return (
    <Card title={"Ongoins agreements"} style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <List
        bordered={false}
        itemLayout="vertical"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={AgreementsCreatedEvents}
        renderItem={item => (
          <Agreement
            canVote={false}
            admin={true}
            mainnetProvider={mainnetProvider}
            contractAddress={item.args._contract}
            localProvider={localProvider}
            address={address}
            tx={tx}
            userSigner={userSigner}
            readContracts={readContracts}
          />
        )}
      />
    </Card>
  );
}
