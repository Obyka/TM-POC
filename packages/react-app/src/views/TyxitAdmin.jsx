import { Button, Divider } from "antd";
import React, { useState } from "react";

import { AddressInput, Address, Balance, Events } from "../components";
import ManageAgreementsTyxit from "../components/custom/ManageAgreementsTyxit";

export default function TyxitAdmin({
  userSigner,
  address,
  mainnetProvider,
  localProvider,
  tx,
  readContracts,
  writeContracts,
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
    <ManageAgreementsTyxit
      localProvider={localProvider}
      address={address}
      tx={tx}
      userSigner={userSigner}
      writeContracts={writeContracts}
      readContracts={readContracts}
    />
  );
}
