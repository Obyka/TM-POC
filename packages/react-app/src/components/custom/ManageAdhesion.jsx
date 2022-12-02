import React, { useState } from "react";
import { Button, Card } from "antd";
import { AddressInput, Address, Balance, Events } from "../";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useContractReader, useBalance } from "eth-hooks";
import Artist from "./Artist";
import { local } from "web3modal";
import { useEffect } from "react";
import { ethers } from "ethers";
import { ArtistABI } from "./Artist";
export default function ManageAffiliations({
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

  const localProviderPollingTime = 1;
  const adhesionAddress = useContractReader(
    readContracts,
    "FactoryCloneArtist",
    "artistToContract",
    [address],
    localProviderPollingTime,
  );
  const balance = useBalance(localProvider, adhesionAddress, localProviderPollingTime);

  return (
    <Card title={"Adhesion contract"} style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <Card.Meta title={"Balance"} description={<div> {ethers.utils.formatEther(balance)} Ξ</div>}></Card.Meta>

      <Button
        style={{ marginTop: 8 }}
        onClick={async () => {
          try {
            if (adhesionAddress) {
              const contract = new ethers.Contract(adhesionAddress, ArtistABI, userSigner);

              console.log(`adhesionAddress ${adhesionAddress}`);
              console.log(`ArtistABI ${ArtistABI}`);

              const result = tx(contract.withdraw(), updateNotif);
              console.log("awaiting metamask/web3 confirm result...", result);
              console.log(await result);
            }
          } catch (e) {
            console.log(e);
          }
        }}
      >
        Redeem your benefits
      </Button>
    </Card>
  );
}
