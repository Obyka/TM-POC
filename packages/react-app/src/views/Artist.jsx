import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch, Upload } from "antd";
import React, { useState } from "react";
import { useContractReader } from "eth-hooks";
import { AddressInput, Address, Balance, Events } from "../components";
import CreateArtist from "../components/custom/CreateArtist";
import MintNFT from "../components/custom/MintNFT";

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
  if (artistContract == 0) {
    return <CreateArtist address={address} tx={tx} writeContracts={writeContracts} readContracts={readContracts} />;
  } else {
    return <MintNFT address={address} tx={tx} writeContracts={writeContracts} readContracts={readContracts} />;
  }
}
