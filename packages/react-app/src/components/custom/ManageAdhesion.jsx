import { Button, Card } from "antd";
import { useBalance, useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import React from "react";
import { ArtistABI } from "./Artist";
import { updateNotif } from "../../helpers/helperFunctions.jsx";

export default function ManageAffiliations({
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
  userSigner,
}) {
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
