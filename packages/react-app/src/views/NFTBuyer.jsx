import { Button, Divider } from "antd";
import React, { useState } from "react";

import { AddressInput, Address, Balance, Events } from "../components";
import ListSales from "../components/custom/ListSales";

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
    <ListSales
      address={address}
      tx={tx}
      readContracts={readContracts}
      writeContracts={writeContracts}
      mainnetProvider={mainnetProvider}
      localProvider={localProvider}
      userSigner={userSigner}
    />
  );
}
