import { Card, Button, Form, InputNumber, Input, Select } from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useContractReader } from "eth-hooks";
import React from "react";
import { Address, Events } from "../";
import { ethers } from "ethers";
import { useState } from "react";
const { Meta } = Card;
export default function Settings({
  address,
  tx,
  readContracts,
  writeContracts,
  mainnetProvider,
  localProvider,
  userSigner,
}) {
  const localProviderPollingTime = 1;
  const maxFeeAmount = useContractReader(readContracts, "Settings", "maxFeeAmount", []);
  const feeAmount = useContractReader(readContracts, "Settings", "feeAmount", []);
  const feeReceiver = useContractReader(readContracts, "Settings", "feeReceiver", []);
  const administrator = useContractReader(readContracts, "Settings", "administrator", []);
  const maxTierPrices = useContractReader(readContracts, "Settings", "getMaxTierPrices", []);
  const collectionAddress = useContractReader(readContracts, "Settings", "collectionAddress", []);
  const tierPrices = useContractReader(readContracts, "Settings", "getTierPrices", []);

  //console.log(feeReceiver)
  const [feeReceiverInput, setFeeReceiverInput] = useState(0);
  const [collectionAddressInput, setCollectionAddressInput] = useState(0);
  const [feeReceiverAmountInput, setFeeReceiverAmountInput] = useState(0);
  const [administratorInput, setAdministratorInput] = useState(0);
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [platinium, setPlatinium] = useState(0);

  return (
    <>
      <Card title="Current settings" style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
        <Meta style={{ margin: 10 }} title="Fee amount" description={feeAmount && `${feeAmount.toNumber() / 100}%`} />
        <Meta
          style={{ margin: 10 }}
          title="Maximum fee"
          description={maxFeeAmount && `${maxFeeAmount.toNumber() / 100}%`}
        />

        <Meta
          style={{ margin: 10 }}
          title="Fee receiver"
          description={feeReceiver && <Address address={feeReceiver} ensProvider={mainnetProvider} fontSize={15} />}
        />
        <Meta
          style={{ margin: 10 }}
          title="Administrator"
          description={administrator && <Address address={administrator} ensProvider={mainnetProvider} fontSize={15} />}
        />
        <Meta
          style={{ margin: 10 }}
          title="Collection address"
          description={
            collectionAddress && <Address address={collectionAddress} ensProvider={mainnetProvider} fontSize={15} />
          }
        />
        <Meta
          style={{ margin: 10 }}
          title="Current tier prices"
          description={tierPrices && tierPrices.map(elem => ethers.utils.formatEther(elem) + "Ξ ")}
        />
        <Meta
          style={{ margin: 10 }}
          title="Max tier prices"
          description={maxTierPrices && maxTierPrices.map(elem => ethers.utils.formatEther(elem) + "Ξ ")}
        />
      </Card>
      {/* <Card title="Edit settings" style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
            <Form
                name="settings"
                autoComplete="off"
                style={{maxWidth: 600, margin:"auto"}}
            >
                <Form.Item
                    label="Fee receiver"
                    name="feeReceiver"
                    rules={[
                        {
                            required: true,
                            message: 'Please set a fee receiver!',
                        },
                    ]}
                >
                    <Input onChange={e=>setFeeReceiverInput(e)}/>
                </Form.Item>

                <Form.Item
                    label="Administrator"
                    name="administrator"
                    rules={[
                        {
                            required: true,
                            message: 'Please set an administrator!',
                        },
                    ]}
                >
                    <Input onChange={e => setAdministratorInput(e)}/>
                </Form.Item>

                <Form.Item label="Fee amount">
                    <InputNumber min={0} max={100} defaultValue={0} onChange={e => setFeeReceiverAmountInput(e)} />
                </Form.Item>
                <Form.Item label="Tier prices" style={{ marginBottom: 0, display:"flex"}}>
                <Form.Item style={{ display: 'inline-block', width: '100px', }}>
                    <InputNumber min={0} max={100} defaultValue={0} onChange={e => setSilver(e)} />
                </Form.Item>

                <Form.Item style={{ display: 'inline-block', width: '100px', }}>
                    <InputNumber min={0} max={100} defaultValue={0} onChange={e => console.log(e)} />
                </Form.Item>

                <Form.Item style={{ display: 'inline-block', width: '100px', }}>
                    <InputNumber min={0} max={100} defaultValue={0} onChange={e => console.log(e)} />
                </Form.Item>
                </Form.Item>
                <Form.Item
                    label="Collection address"
                    name="collection"
                    rules={[
                        {
                            required: true,
                            message: 'Please set an administrator!',
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
                </Card>*/}
    </>
  );
}
