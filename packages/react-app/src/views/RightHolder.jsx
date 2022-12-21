import React from "react";
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
