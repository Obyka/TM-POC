import { List } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import React from "react";
import Agreement from "./Agreement";
export default function ManageAgreementsArtists({
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

  let artistAgreements = AgreementsCreatedEvents.filter(elem => elem.args._coArtists.includes(address)).map(
    elem => elem.args._contract,
  );

  return (
    <>
      <h3>Ongoing agreements</h3>
      <List
        bordered={false}
        itemLayout="vertical"
        rowKey={item => `${item.transactionHash}_${item.logIndex}`}
        dataSource={artistAgreements}
        renderItem={item => (
          <Agreement
            canVote={true}
            admin={false}
            mainnetProvider={mainnetProvider}
            contractAddress={item}
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
