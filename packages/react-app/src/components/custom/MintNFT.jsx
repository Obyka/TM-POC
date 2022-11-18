import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import React, { useState } from "react";

import { create } from "ipfs-http-client";

import { AddressInput, Address, Balance, Events } from "../";

export default function MintNFT({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const projectId = process.env.REACT_APP_IPFS_PROJECT_ID;
  const projectSecret = process.env.REACT_APP_IPFS_PROJECT_SECRET;
  console.log(`Project id is ${projectId}`);
  const authorization = "Basic " + btoa(projectId + ":" + projectSecret);
  let ipfs;
  try {
    ipfs = create({
      url: "https://ipfs.infura.io:5001/api/v0",
      headers: {
        authorization,
      },
    });
  } catch (error) {
    console.log(error);
    ipfs = undefined;
  }

  const [sampleNFTState, setSampleNFTState] = useState({
    owner: 0x0,
    uri: "",
    approve: "",
    tokenId: 1,
    date: new Date().toLocaleString(),
    title: "",
    author: "",
    image: "",
  });

  const [image, setImage] = useState("");

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

  const onSubmitHandler = async event => {
    event.preventDefault();
    const form = event.target;
    const files = form[0].files;

    if (!files || files.length === 0) {
      return alert("No files selected");
    }

    const file = files[0];
    // upload files
    const result = await ipfs.add(file);

    setImage({
      cid: result.cid,
      path: result.path,
    });

    form.reset();
  };

  return (
    <div>
      {/*
       */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Sample NFT contract:</h2>
        <Address address={writeContracts.SampleNFT.address} ensProvider={mainnetProvider} fontSize={15} />
        <Divider />
        <div style={{ margin: 8 }}>
          <h3>Mint NFT</h3>
          {ipfs && (
            <>
              <form style={{ marginBottom: 8 }} onSubmit={onSubmitHandler}>
                <input name="file" type="file" />

                <button type="submit">Upload File</button>
              </form>

              <div style={{ marginBottom: 8 }}>
                <img
                  alt={`NFT Image to mint`}
                  src={"https://tyxit-demo.infura-ipfs.io/ipfs/" + image.path}
                  style={{ maxWidth: "100px", margin: "0px" }}
                />
              </div>
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <DatePicker
              onChange={(date, dateString) => {
                setSampleNFTState(prev => ({
                  ...prev,
                  date: dateString,
                }));
              }}
            />
          </div>

          <Input
            style={{ marginTop: 8 }}
            placeholder="Title"
            onChange={e => {
              setSampleNFTState(prev => ({
                ...prev,
                title: e.target.value,
              }));
            }}
          />

          <Input
            style={{ marginTop: 8 }}
            placeholder="Author"
            onChange={e => {
              setSampleNFTState(prev => ({
                ...prev,
                author: e.target.value,
              }));
            }}
          />

          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              console.log(JSON.stringify(sampleNFTState));
              const objectToSend = {
                description: `Music NFT made by ${sampleNFTState.author} on ${sampleNFTState.date}.`,
                image: `https://tyxit-demo.infura-ipfs.io/ipfs/${image.path}`,
                name: sampleNFTState.title,
              };
              console.log(JSON.stringify(objectToSend));
              const jsonUploadResult = await ipfs.add(JSON.stringify(objectToSend));
              console.log(jsonUploadResult);

              const result = tx(
                writeContracts.SampleNFT.safeMint(address, `ipfs://${jsonUploadResult.path}`),
                update => {
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
                },
              );
              console.log("awaiting metamask/web3 confirm result...", result);
              console.log(await result);
            }}
          >
            Mint NFT
          </Button>
        </div>
        <Divider />
        Your Address:
        <Address address={address} ensProvider={mainnetProvider} fontSize={15} />
        <Divider />
      </div>

      <Events
        contracts={readContracts}
        contractName="SampleNFT"
        eventName="Transfer"
        eventTitle="Création ou transfert"
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
      />
    </div>
  );
}
