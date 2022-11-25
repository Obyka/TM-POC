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
  userSigner,
}) {
  return (
    <ManageAffiliations
      localProvider={localProvider}
      address={address}
      tx={tx}
      writeContracts={writeContracts}
      readContracts={readContracts}
      userSigner={userSigner}
    />
  );
}
