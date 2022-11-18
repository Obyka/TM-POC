import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import { AddressInput, Address, Balance, Events } from "../";

export default function CreateArtist({ address, tx, readContracts, writeContracts, mainnetProvider }) {
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

  const [rightHolders, setRightHolders] = useState(address);
  const [shares, setShares] = useState("100");

  return (
    <div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Create artist:</h2>
        <Address address={writeContracts.FactoryCloneArtist.address} ensProvider={mainnetProvider} fontSize={15} />

        <Divider />
        <div style={{ margin: 8 }}>
          <h3>Create a new artist</h3>

          <div style={{ margin: 8 }}>
            <Input
              placeholder="Right holders"
              onChange={e => {
                setRightHolders(e.target.value);
                console.log(rightHolders);
              }}
            />
          </div>

          <div style={{ margin: 8 }}>
            <Input
              placeholder="Shares"
              onChange={e => {
                setShares(e.target.value);
                console.log(e.target.value);
              }}
            />
          </div>

          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              const splittedRightHolders = rightHolders.split(",");
              const splittedShares = shares.split(",").map(s => parseInt(s, 10));

              console.log(`Right holder ${splittedRightHolders}`);
              console.log(`Shares ${splittedShares}`);

              const result = tx(
                writeContracts.FactoryCloneArtist.createArtist(splittedRightHolders, splittedShares),
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
