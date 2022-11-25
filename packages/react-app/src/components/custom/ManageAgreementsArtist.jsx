import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button, Card, List, Collapse } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import Agreement from "./Agreement";
import VoteForm from "./VoteForm";
const { Panel } = Collapse;
export default function ManageAgreementsArtists({
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

  let artistAgreements = AgreementsCreatedEvents.filter(elem => elem.args._coArtists.includes(address)).map(
    elem => elem.args._contract,
  );
  console.log(`Artist agreements ${JSON.stringify(artistAgreements)}`);

  return (
    <Card title={"Ongoins agreements"} style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <List
        bordered={false}
        itemLayout="vertical"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={artistAgreements}
        renderItem={item => (
          <Agreement
            canVote={true}
            admin={false}
            mainnetProvider={mainnetProvider}
            contractAddress={item}
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
