import { Button, Divider } from "antd";
import React, { useState } from "react";

import { AddressInput, Address, Balance, Events } from "../components";

export default function RightHolder({ address, mainnetProvider, localProvider, tx, readContracts, writeContracts }) {
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
    <div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Current sales:</h2>
      </div>
    </div>
  );
}
