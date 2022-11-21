import { Button, DatePicker, Divider, Input, Card, Form } from "antd";
import React, { useState } from "react";
import { ethers } from "ethers";
import { InfoCircleOutlined } from "@ant-design/icons";
import { readString } from "react-papaparse";

import { create } from "ipfs-http-client";

import { Address, Events } from "../";

export default function MintNFT({ address, mainnetProvider, localProvider, tx, readContracts, writeContracts }) {
  const projectId = process.env.REACT_APP_IPFS_PROJECT_ID;
  const projectSecret = process.env.REACT_APP_IPFS_PROJECT_SECRET;
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
  const [artists, setArtists] = useState("");

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
      <Card title="Sample NFT contract" style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
        <Address address={writeContracts.SampleNFT.address} ensProvider={mainnetProvider} fontSize={15} />
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
          <Form layout="vertical">
            <Form.Item label="DatePicker">
              <DatePicker
                onChange={(date, dateString) => {
                  setSampleNFTState(prev => ({
                    ...prev,
                    date: dateString,
                  }));
                }}
              />
            </Form.Item>
            <Form.Item label="Title">
              <Input
                onChange={e => {
                  setSampleNFTState(prev => ({
                    ...prev,
                    title: e.target.value,
                  }));
                }}
              />
            </Form.Item>

            <Form.Item label="Author">
              <Input
                onChange={e => {
                  setSampleNFTState(prev => ({
                    ...prev,
                    author: e.target.value,
                  }));
                }}
              />
            </Form.Item>

            <Form.Item
              label="Co-artists addresses"
              name="coartists"
              style={{ margin: 0 }}
              tooltip={{
                title: "Enter each artist's address as a separate row",
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input.TextArea
                placeholder={`0xaddress\n0xaddress\n0xaddress`}
                onChange={event => {
                  setArtists([]);

                  const results = readString(event.target.value, { dynamicTyping: true });
                  let invalidData = false;

                  try {
                    if (results.data) {
                      results.data.map(currentLine => {
                        if (!ethers.utils.isAddress(currentLine[0])) {
                          setArtists([address]);
                          throw "invalid data";
                          invalidData = true;
                        } else {
                          console.log("congrat");
                          setArtists(prev => [...prev, currentLine[0]]);
                        }
                        return currentLine;
                      });
                    }
                  } catch (e) {
                    console.log(e);
                  }
                }}
                rows={4}
              />
            </Form.Item>

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

                tx(writeContracts.SampleNFT.safeMint(address, `ipfs://${jsonUploadResult.path}`), updateNotif).then(
                  result => {
                    console.log(result);
                    result.wait().then(async receipt => {
                      // TokenID
                      // https://github.com/scaffold-eth/scaffold-eth-examples/blob/merkler/packages/react-app/src/views/NewMerkler.jsx
                      console.log(`Minted tokenID ${receipt.events[0].args[2]}`);

                      const tokenID = receipt.events[0].args[2];
                      // We need to predict deployment address to avoid useless TXs
                      const randomNumberSalt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
                      const implementationAddress = await readContracts.FactoryCloneAgreement.agreementImpl();

                      console.log(
                        `Salt: ${randomNumberSalt}\n Impl. Address: ${implementationAddress}\n Address: ${address}`,
                      );
                      const predictAddressPromise = tx(
                        readContracts.FactoryCloneAgreement.predictDeterministicAddress(
                          implementationAddress,
                          randomNumberSalt,
                          address,
                        ),
                      );
                      predictAddressPromise.then(function (predictedAddress) {
                        console.log(`predicted address is ${predictedAddress}`);

                        tx(writeContracts.SampleNFT.approve(predictedAddress, tokenID), updateNotif)
                          .then(result => {
                            artists.push(address);
                            console.log(`Created Agreement ${artists}\n${readContracts.SampleNFT.address}\n${tokenID}`);
                            tx(
                              writeContracts.FactoryCloneAgreement.createAgreement(
                                artists,
                                readContracts.SampleNFT.address,
                                tokenID,
                                randomNumberSalt,
                              ),
                              updateNotif,
                            )
                              .then(() => console.log("Creation du contrat d'agreement"))
                              .catch(error => console.log(error));
                          })
                          .catch(error => console.log(error));
                      });
                    });
                  },
                );
              }}
            >
              Create an agreement
            </Button>
          </Form>
        </div>
        <Divider />
        Your Address:
        <Address address={address} ensProvider={mainnetProvider} fontSize={15} />
      </Card>
      <Events
        contracts={readContracts}
        contractName="SampleNFT"
        eventName="Approval"
        eventTitle="Approval d'une adresse"
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
      />
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
