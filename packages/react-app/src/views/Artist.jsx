import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { AddressInput, Address, Balance, Events } from "../components";

export default function Artist({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const artistContract = useContractReader(readContracts, "FactoryCloneArtist", "artistToContract", [address], 5);

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
        <h2>Artist Factory Clone contract:</h2>
        <Address address={writeContracts.FactoryCloneArtist.address} ensProvider={mainnetProvider} fontSize={15} />

        <Divider />
        <div style={{ margin: 8 }}>
          <h3>Create a new artist</h3>

          <div style={{ margin: 8 }}>
            <Input
              placeholder="Right holder 1"
              onChange={e => {
                console.log(e.target.value);
              }}
            />
          </div>

          <div style={{ margin: 8 }}>
            <Input
              placeholder="Right holder 2"
              onChange={e => {
                console.log(e.target.value);
              }}
            />
          </div>

          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              const result = tx(
                writeContracts.FactoryCloneArtist.createArtist(
                  ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2"],
                  [50, 50],
                ),
                updateNotif,
              );
              console.log("awaiting metamask/web3 confirm result...", result);
              console.log(await result);
            }}
          >
            Clone contract
          </Button>
        </div>

        <Divider />

        {artistContract}
      </div>
    </div>
  );
}
