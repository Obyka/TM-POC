import { Button, Divider, Collapse } from "antd";
import React, { useState } from "react";
import { AddressInput, Address, Balance, Events } from "../components";
import ListSales from "../components/custom/ListSales";
import ListOwnedNFTs from "../components/custom/ListOwnedNFTs";
const { Panel } = Collapse;

export default function NFTBuyer({
  address,
  mainnetProvider,
  localProvider,
  tx,
  readContracts,
  writeContracts,
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

  return (
    <Collapse defaultActiveKey={["2"]} accordion>
      <Panel header="Listed NFTs" key="1">
        <ListSales
          address={address}
          tx={tx}
          readContracts={readContracts}
          writeContracts={writeContracts}
          mainnetProvider={mainnetProvider}
          localProvider={localProvider}
          userSigner={userSigner}
        />
      </Panel>
      <Panel header="Owned NFTs" key="2">
        <ListOwnedNFTs
          address={address}
          tx={tx}
          readContracts={readContracts}
          writeContracts={writeContracts}
          mainnetProvider={mainnetProvider}
          localProvider={localProvider}
          userSigner={userSigner}
        />
      </Panel>
    </Collapse>
  );
}
