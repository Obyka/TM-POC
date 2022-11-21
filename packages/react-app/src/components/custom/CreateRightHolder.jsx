import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { Button, Card, Form, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
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

  const [deploying, setDeploying] = useState(false);

  return (
    <Card
      title="Create your adhesion contract as a right holder"
      style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}
    >
      <Address address={writeContracts.FactoryCloneRightHolder.address} ensProvider={mainnetProvider} fontSize={15} />
      <Form layout="vertical">
        <Button
          loading={deploying}
          style={{ marginTop: 8 }}
          onClick={async () => {
            setDeploying(true);

            try {
              const result = tx(writeContracts.FactoryCloneRightHolder.createRightHolder(), updateNotif);

              console.log("awaiting metamask/web3 confirm result...", result);
              console.log(await result);
            } catch (e) {
              setDeploying(false);
              console.log(e);
            }
          }}
        >
          Create your adhesion contract
        </Button>
      </Form>
    </Card>
  );
}
