import { Button, Divider, Input } from "antd";
import { useContractReader } from "eth-hooks";
import React, { useState } from "react";
import { Address } from "..";

export default function AgreementsArtist({ address, tx, readContracts, writeContracts, mainnetProvider }) {
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
  const [deploying, setDeploying] = useState(false);

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
            loading={deploying}
            style={{ marginTop: 8 }}
            onClick={async () => {
              setDeploying(true);
              const splittedRightHolders = rightHolders.split(",");
              const splittedShares = shares.split(",").map(s => parseInt(s, 10));

              console.log(`Right holder ${splittedRightHolders}`);
              console.log(`Shares ${splittedShares}`);
              try {
                const result = tx(
                  writeContracts.FactoryCloneArtist.createArtist(splittedRightHolders, splittedShares),
                  updateNotif,
                );

                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              } catch (e) {
                setDeploying(false);
                console.log(e);
              }
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
