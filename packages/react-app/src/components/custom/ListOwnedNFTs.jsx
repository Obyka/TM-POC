import { List } from "antd";
import { useContractReader } from "eth-hooks";
import React, { useEffect, useState } from "react";
import NFT from "./NFT.jsx";

export default function ListSales({ userSigner, address, tx, readContracts, localProvider }) {
  const balanceLength = useContractReader(readContracts, "SampleNFT", "balanceOf", [address]);
  const [balance, setBalance] = useState([]);

  useEffect(() => {
    const updateSampleNFTs = async () => {
      const collectibleUpdate = [];
      for (let tokenIndex = 0; tokenIndex < balanceLength; tokenIndex++) {
        try {
          console.log("Getting token index", tokenIndex);
          const tokenId = await readContracts.SampleNFT.tokenOfOwnerByIndex(address, tokenIndex);
          console.log("tokenId", tokenId);
          collectibleUpdate.push(tokenId);
        } catch (e) {
          console.log(e);
        }
      }
      setBalance(collectibleUpdate);
    };
    updateSampleNFTs();
  }, [address, balanceLength]);

  return (
    <List
      bordered={false}
      /*grid={{
        gutter: 16,
        xs: 1,
        sm: 2,
        md: 4,
        lg: 4,
        xl: 6,
        xxl: 3,
      }}*/
      rowKey={item => `${item}`}
      dataSource={balance}
      renderItem={item => (
        <List.Item>
          <NFT
            tx={tx}
            readContracts={readContracts}
            localProvider={localProvider}
            userSigner={userSigner}
            nftAddress={readContracts.SampleNFT.address}
            tokenId={item}
          />
        </List.Item>
      )}
    />
  );
}
