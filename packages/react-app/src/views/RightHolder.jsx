import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { AddressInput, Address, Balance, Events } from "../components";
import CreateRightHolder from "../components/custom/CreateRightHolder";

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
  const rightHolderContract = useContractReader(
    readContracts,
    "FactoryCloneRightHolder",
    "rightHolderToContract",
    [address],
    5,
  );
  return (
    rightHolderContract == 0 && (
      <CreateRightHolder address={address} tx={tx} writeContracts={writeContracts} readContracts={readContracts} />
    )
  );
}
