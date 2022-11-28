import React, { useState, useEffect } from "react";
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
  const [validData, setValidData] = useState(false);
  useEffect(() => {
    console.log(`Shares: ${shares}`);
    console.log(`rightHolders: ${rightHolders}`);
  }, [shares, rightHolders]);

  return (
    <Card title="Create your adhesion contract" style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <Address address={writeContracts.FactoryCloneArtist.address} ensProvider={mainnetProvider} fontSize={15} />
      <Form layout="vertical">
        <Form.Item
          label="Right holders and their shares"
          name="rightholders"
          style={{ margin: 0 }}
          tooltip={{
            title:
              "Enter each right holder (yourself excepted) as a separate row, with their address and their shares in percent",
            icon: <InfoCircleOutlined />,
          }}
        >
          <Input.TextArea
            placeholder={`0xaddress,amount\n0xaddress,amount\n0xaddress,amount`}
            onChange={event => {
              setShares([]);
              setRightHolders([]);
              const results = readString(event.target.value, { dynamicTyping: true });
              console.log(`String: ${event.target.value}`);
              try {
                if (results.data) {
                  results.data.forEach(currentLine => {
                    if (
                      currentLine[0] === address ||
                      !ethers.utils.isAddress(currentLine[0]) ||
                      typeof currentLine[1] !== "number" ||
                      currentLine[1] > 100 ||
                      currentLine.length != 2
                    ) {
                      setValidData(false);
                    } else {
                      setValidData(true);
                    }
                  });

                  if (!validData) {
                    throw "invalid data";
                  } else {
                    setRightHolders(results.data.map(current => current[0]));
                    setShares(results.data.map(current => current[1]));
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
          disabled={!validData}
          loading={deploying}
          style={{ marginTop: 8 }}
          onClick={async () => {
            setDeploying(true);

            console.log(`Right holder ${rightHolders}`);
            console.log(`Shares ${shares}`);
            shares.map(share => share * 100);
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
