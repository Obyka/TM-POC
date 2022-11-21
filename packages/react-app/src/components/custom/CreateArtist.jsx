import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Form, Card, Divider, Input, Slider, Spin, Switch, Upload } from "antd";
import { AddressInput, Address, Balance, Events } from "../";
import { readString } from "react-papaparse";
import { ethers } from "ethers";

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

  const [rightHolders, setRightHolders] = useState([address]);
  const [shares, setShares] = useState([100]);
  const [deploying, setDeploying] = useState(false);

  return (
    <Card title="Create your adhesion contract" style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <Address address={writeContracts.FactoryCloneArtist.address} ensProvider={mainnetProvider} fontSize={15} />
      <Form layout="vertical">
        <Form.Item
          label="Right holders and their shares"
          name="rightholders"
          style={{ margin: 0 }}
          tooltip={{
            title: "Enter each right holder as a separate row, with their address and their shares in percent",
            icon: <InfoCircleOutlined />,
          }}
        >
          <Input.TextArea
            placeholder={`0xaddress,amount\n0xaddress,amount\n0xaddress,amount`}
            onChange={event => {
              setShares([]);
              setRightHolders([]);
              const results = readString(event.target.value, { dynamicTyping: true });
              let invalidData = false;

              try {
                if (results.data) {
                  results.data.map(currentLine => {
                    if (
                      !ethers.utils.isAddress(currentLine[0]) ||
                      typeof currentLine[1] !== "number" ||
                      currentLine[1] >= 100
                    ) {
                      invalidData = true;
                    } else {
                      console.log("congrat");
                      setRightHolders(prev => [...prev, currentLine[0]]);
                      setShares(prev => [...prev, currentLine[1]]);
                    }
                    return currentLine;
                  });

                  if (invalidData) {
                    setRightHolders([address]);
                    setShares([100]);
                    throw "invalid data";
                  }
                }
              } catch (e) {
                console.log(e);
              }
            }}
            rows={4}
          />
        </Form.Item>

        <Button
          loading={deploying}
          style={{ marginTop: 8 }}
          onClick={async () => {
            setDeploying(true);
            //const splittedRightHolders = rightHolders.split(",");
            //const splittedShares = shares.split(",").map(s => parseInt(s, 10));

            console.log(`Right holder ${rightHolders}`);
            console.log(`Shares ${shares}`);
            try {
              const result = tx(writeContracts.FactoryCloneArtist.createArtist(rightHolders, shares), updateNotif);

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
