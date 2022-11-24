import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button, Card, List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Address } from "../";

export default function ManageAgreementsArtist({
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
  userSigner,
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

  let AgreementsCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneAgreement",
    "AgreementCreated",
    localProvider,
    1,
  );

  const AgreementABI = ["function cancelAgreement() public", "function getState() public view returns(uint)"];
  const states = ["Uninitialized", "Initialized", "Sale open", "Redeemable", "Canceled"];

  const agreements = new Map();
  AgreementsCreatedEvents.forEach(elem => {
    agreements.set(elem.transactionHash, {
      contract: new ethers.Contract(elem.args._contract, AgreementABI, userSigner),
      state: "",
    });
  });
  const [mapState, setMapState] = useState(new Map());

  /*useEffect(() => {
    // create a interval and get the id
    const myInterval = setInterval(() => {
      console.log(agreements)
      agreements.forEach((value, key) => {
        setMapState(async (prev) => {
          new Map(mapState.set(key, await value.contract.getState()))
        })
        
      })
    }, 5000);
    return () => clearInterval(myInterval);
  }, []);*/

  return (
    <Card title={"Ongoins agreements"} style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <List
        bordered={true}
        itemLayout="vertical"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={AgreementsCreatedEvents}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={
                <>
                  Agreement's address{" "}
                  <Address address={item.args._contract} ensProvider={mainnetProvider} fontSize={15} />
                </>
              }
              description={
                <>
                  Co-artists:{" "}
                  <ul>
                    {item.args._coArtists.map(artist => (
                      <li>
                        <Address address={artist} ensProvider={mainnetProvider} fontSize={15} />
                      </li>
                    ))}
                  </ul>
                </>
              }
            />
            <List.Item.Meta
              title={<>State of the contract</>}
              description={
                <>{mapState.has(item.transactionHash) && states[mapState.get(item.transactionHash).toString()]}</>
              }
            />
            <Button
              onClick={async () => {
                const contract = agreements.get(item.transactionHash).contract;
                let tx = await contract.cancelAgreement();
                console.log(`USER ${userSigner}`);
              }}
            >
              Cancel agreement
            </Button>

            <Button
              onClick={async () => {
                const contract = agreements.get(item.transactionHash).contract;
                setMapState(new Map(mapState.set(item.transactionHash, await contract.getState())));
                let tx = await contract.getState();
                console.log(`${tx}`);
              }}
            >
              Get Status
            </Button>
          </List.Item>
        )}
      />
    </Card>
  );
}
