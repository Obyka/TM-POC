import { Collapse } from "antd";
import React from "react";
import ManageAgreementsTyxit from "../components/custom/ManageAgreementsTyxit";
import Settings from "../components/custom/Settings";

const { Panel } = Collapse;

export default function TyxitAdmin({
  userSigner,
  address,
  mainnetProvider,
  localProvider,
  tx,
  readContracts,
  writeContracts,
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

  return (
    <Collapse defaultActiveKey={["2"]} accordion>
      <Panel header="Manage agreements" key="1">
        <ManageAgreementsTyxit
          localProvider={localProvider}
          address={address}
          tx={tx}
          userSigner={userSigner}
          writeContracts={writeContracts}
          readContracts={readContracts}
        />
      </Panel>
      <Panel header="Manage settings" key="2">
        <Settings
          localProvider={localProvider}
          address={address}
          tx={tx}
          userSigner={userSigner}
          writeContracts={writeContracts}
          readContracts={readContracts}
        />
      </Panel>
    </Collapse>
  );
}
