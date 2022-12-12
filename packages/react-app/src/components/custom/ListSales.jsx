import { Button, List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { AgreementABI } from "./Agreement.jsx";
import NFT from "./NFT.jsx";
import { updateNotif } from "../../helpers/helperFunctions.jsx";

export default function ListSales({
  userSigner,
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
}) {
  let AgreementsCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneAgreement",
    "AgreementCreated",
    localProvider,
    1,
  );

  const [sales, setSales] = useState(new Map());

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

    const forSale = contract.filters.ForSale();
    const forSaleEvents = await contract.queryFilter(forSale, 0);
    const price = forSaleEvents[0].args._price;

    return [collectionAddress, tokenId, price];
  }
  async function initStateFromEvents() {
    AgreementsContract.forEach(async currentContract => {
      if (!(await checkForSale(currentContract))) {
        return;
      }
      let result = await extractInfoFromEvents(currentContract);
      console.log(`price: ${result[3]}`);
      updateSalesMap(currentContract.address, {
        tokenId: result[1],
        collectionId: result[0],
        price: result[2],
        contract: currentContract,
      });
    });
  }

  useEffect(() => {
    initStateFromEvents();
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
      grid={{
        gutter: 16,
        xs: 1,
        sm: 2,
        md: 4,
        lg: 4,
        xl: 6,
        xxl: 3,
      }}
      rowKey={item => `${item}`}
      dataSource={Array.from(sales.keys())}
      renderItem={item => (
        <List.Item>
          <NFT
            tx={tx}
            readContracts={readContracts}
            localProvider={localProvider}
            userSigner={userSigner}
            nftAddress={sales.get(item).collectionId}
            price={sales.get(item).price}
            tokenId={sales.get(item).tokenId}
          />
          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              try {
                const options = { value: sales.get(item).price };
                const reciept = tx(sales.get(item).contract.purchase(options), updateNotif);
              } catch (error) {
                console.log(error);
              }
            }}
          >
            Buy item
          </Button>
        </List.Item>
      )}
    />
  );
}
