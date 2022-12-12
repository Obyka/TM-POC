import { Button, Card, Form } from "antd";
import React, { useState } from "react";
import { Address } from "../";
import { updateNotif } from "../../helpers/helperFunctions.jsx";

export default function CreateRightHolder({ address, tx, readContracts, writeContracts, mainnetProvider }) {
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
