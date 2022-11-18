import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { AddressInput, Address, Balance, Events } from "../components";
import CreateArtist from "../components/custom/CreateArtist";

export default function Artist({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const artistContract = useContractReader(readContracts, "FactoryCloneArtist", "artistToContract", [address], 5);
  return (
    artistContract == 0 && (
      <CreateArtist address={address} tx={tx} writeContracts={writeContracts} readContracts={readContracts} />
    )
  );
}
