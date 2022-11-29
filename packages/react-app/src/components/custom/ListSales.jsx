import React, { useState, useEffect } from "react";
import { useContractReader } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Button, Form, Card, Space, Input, Slider, Spin, Switch, List, InputNumber } from "antd";
import { AddressInput, Address, Balance, Events } from "../";
import { readString } from "react-papaparse";
import { ethers } from "ethers";
import { AgreementABI } from "./Agreement.jsx";
import { NFTABI } from "./NFT.jsx";
import { create } from "ipfs-http-client";

const { BufferList } = require("bl");
const projectId = process.env.REACT_APP_IPFS_PROJECT_ID;
const projectSecret = process.env.REACT_APP_IPFS_PROJECT_SECRET;
const authorization = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

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

console.log(`IPFS: ${JSON.stringify(ipfs)}`);

const getFromIPFS = async hashToGet => {
  const content = new BufferList();
  for await (const chunk of ipfs.cat(hashToGet)) {
    content.append(chunk);
  }
  return JSON.parse(content.toString());
};

export default function ListSales({
  userSigner,
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
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

  const [sales, setSales] = useState(new Map());
  const [nftContract, setNftContract] = useState(-1);
  const updateSalesMap = (k, v) => {
    setSales(new Map(sales.set(k, v)));
  };
  const deleteKeySalesMap = k => {
    setSales(prev => {
      const newState = new Map(prev);
      newState.delete(k);
      return newState;
    });
  };

  let AgreementsAddress = AgreementsCreatedEvents.map(elem => elem.args._contract);
  let AgreementsContract = AgreementsAddress.map(element => new ethers.Contract(element, AgreementABI, userSigner));

  async function checkForSale(contract) {
    const forSale = contract.filters.ForSale();
    const forSaleEvents = await contract.queryFilter(forSale, 0);
    const canceled = contract.filters.Canceled();
    const canceledEvents = await contract.queryFilter(canceled, 0);

    const purchase = contract.filters.Purchase();
    const purchaseEvents = await contract.queryFilter(purchase, 0);

    return forSaleEvents.length > 0 && canceledEvents.length === 0 && purchaseEvents.length === 0;
  }

  async function extractInfoFromEvents(contract) {
    let Initialized = contract.filters.Init();
    let InitializedEvents = await contract.queryFilter(Initialized, 0);
    let collectionAddress = InitializedEvents[0].args[0];
    let tokenId = InitializedEvents[0].args[1];
    let nft;
    if (nftContract === -1) {
      nft = new ethers.Contract(collectionAddress, NFTABI, userSigner);
      setNftContract(nft);
    } else {
      nft = nftContract;
    }

    let metadata = await nft.tokenURI(tokenId);

    const ipfsHash = metadata.replace("ipfs://", "");
    const objectMetadata = await getFromIPFS(ipfsHash);

    const forSale = contract.filters.ForSale();
    const forSaleEvents = await contract.queryFilter(forSale, 0);
    const price = forSaleEvents[0].args._price.toNumber();

    return [collectionAddress, tokenId, objectMetadata, price];
  }
  async function initStateFromEvents() {
    AgreementsContract.forEach(async currentContract => {
      console.log(checkForSale(currentContract));
      if (!(await checkForSale(currentContract))) {
        return;
      }
      let result = await extractInfoFromEvents(currentContract);
      updateSalesMap(currentContract.address, {
        tokenId: result[1],
        collectionId: result[0],
        nft: result[2],
        price: result[3],
        contract: currentContract,
      });
    });
  }

  useEffect(() => {
    initStateFromEvents();
    console.log("YO");
  }, [AgreementsAddress.length]);

  useEffect(() => {
    AgreementsContract.forEach(contract => {
      contract.removeAllListeners();
    });
    AgreementsContract.forEach(contract => {
      contract.on("ForSale", _price => {
        console.log("CONTRACT STATE -- FORSALE");
      });

      contract.on("Canceled", _price => {
        console.log("CONTRACT STATE -- CANCELED");
        deleteKeySalesMap(contract.address);
      });

      contract.on("Purchase", _price => {
        console.log("CONTRACT STATE -- PURCHASE");
        deleteKeySalesMap(contract.address);
      });
    });

    return () => {
      AgreementsContract.forEach(contract => {
        contract.removeAllListeners();
      });
    };
  }, [AgreementsAddress.length]);
  return (
    <List
      bordered={false}
      itemLayout="vertical"
      rowKey={item => `${item}`}
      dataSource={Array.from(sales.keys())}
      renderItem={item => (
        <List.Item>
          <Card
            hoverable
            style={{
              width: 240,
              margin: "auto",
            }}
            cover={<img alt="NFT Image" src={sales.get(item).nft.image} />}
          >
            <Card.Meta title={`NFT #${sales.get(item).tokenId}`} description={`${sales.get(item).nft.description}`} />
            Price: {ethers.utils.formatEther(sales.get(item).price)}
            <Button
              onClick={async () => {
                const options = { value: sales.get(item).price };
                const reciept = await sales.get(item).contract.purchase(options);
              }}
            >
              Buy item
            </Button>
          </Card>
        </List.Item>
      )}
    />
  );
}
