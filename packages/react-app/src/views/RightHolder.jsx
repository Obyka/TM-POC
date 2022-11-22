import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { AddressInput, Address, Balance, Events } from "../components";
import CreateRightHolder from "../components/custom/CreateRightHolder";
import ManageAffiliations from "../components/custom/ManageAffiliations";

export default function RightHolder({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const rightHolderContractAddress = useContractReader(
    readContracts,
    "FactoryCloneRightHolder",
    "rightHolderToContract",
    [address],
    1,
  );

  if (rightHolderContractAddress == 0) {
    return (
      <CreateRightHolder address={address} tx={tx} writeContracts={writeContracts} readContracts={readContracts} />
    );
  } else {
    return (
      <ManageAffiliations
        rightHolderContractAddress={rightHolderContractAddress}
        localProvider={localProvider}
        address={address}
        tx={tx}
        writeContracts={writeContracts}
        readContracts={readContracts}
      />
    );
  }
}
