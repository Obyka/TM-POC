import { List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import React from "react";
import Agreement from "./Agreement";
export default function ManageAgreementsTyxit({
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
  userSigner,
}) {
  let AgreementsCreatedEvents = useEventListener(
    readContracts,
    "FactoryCloneAgreement",
    "AgreementCreated",
    localProvider,
    1,
  );

  return (
    <>
      <h3>Ongoins agreements</h3>
      <List
        bordered={false}
        itemLayout="vertical"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={AgreementsCreatedEvents}
        renderItem={item => (
          <Agreement
            canVote={false}
            admin={true}
            mainnetProvider={mainnetProvider}
            contractAddress={item.args._contract}
            localProvider={localProvider}
            address={address}
            tx={tx}
            userSigner={userSigner}
            readContracts={readContracts}
          />
        )}
      />
    </>
  );
}
