import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import { AddressInput, Address, Balance, Events } from "../";

export default function CreateRightHolder({ address, tx, readContracts, writeContracts, mainnetProvider }) {
  const rightHolderContract = useContractReader(
    readContracts,
    "FactoryCloneRightHolder",
    "rightHolderToContract",
    [address],
    5,
  );
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
        <h2>Register as a right holder:</h2>
        <Address address={writeContracts.FactoryCloneRightHolder.address} ensProvider={mainnetProvider} fontSize={15} />

        <Divider />
        <div style={{ margin: 8 }}>
          <h3>Join</h3>

          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              const result = tx(writeContracts.FactoryCloneRightHolder.createRightHolder(), updateNotif);
              console.log("awaiting metamask/web3 confirm result...", result);
              console.log(await result);
            }}
          >
            Clone contract
          </Button>
        </div>
        <Divider />

        {rightHolderContract != 0 && rightHolderContract}
      </div>
    </div>
  );
}
