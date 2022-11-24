import { Collapse } from "antd";
import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { AddressInput, Address, Balance, Events } from "../components";
import CreateArtist from "../components/custom/CreateArtist";
import MintNFT from "../components/custom/MintNFT";
import ManageAgreementsArtist from "../components/custom/ManageAgreementsArtist";
import Agreement from "../components/custom/Agreement";
const { Panel } = Collapse;
export default function Artist({
  userSigner,
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const artistContract = useContractReader(readContracts, "FactoryCloneArtist", "artistToContract", [address], 1);
  if (artistContract == 0) {
    return <CreateArtist address={address} tx={tx} writeContracts={writeContracts} readContracts={readContracts} />;
  } else {
    return (
      <Collapse defaultActiveKey={["1"]} accordion>
        <Panel header="Create your agreement" key="1">
          <MintNFT address={address} tx={tx} writeContracts={writeContracts} readContracts={readContracts} />
        </Panel>
        <Panel header="Manage your agreements" key="2">
          {/*<ManageAgreementsArtist
            localProvider={localProvider}
            address={address}
            tx={tx}
            userSigner={userSigner}
            writeContracts={writeContracts}
            readContracts={readContracts}
    />*/}
          <Agreement
            mainnetProvider={mainnetProvider}
            contractAddress={"0x611DB30a654fc657aA26E9A5d9C0C6E78d231a56"}
            localProvider={localProvider}
            address={address}
            tx={tx}
            userSigner={userSigner}
            readContracts={readContracts}
          />
        </Panel>
      </Collapse>
    );
  }
}
