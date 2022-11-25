import React from "react";
import { Button, Select, Form, Checkbox, InputNumber } from "antd";
import { useState } from "react";
import { ethers } from "ethers";

const { Option } = Select;

export default function VoteForm({ tx, agreementContract }) {
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

  const onFinish = values => {
    console.log("Success:", values);
  };
  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const [royaltiesInBps, setRoyaltiesInBps] = useState(0);
  const [ownShare, setOwnShare] = useState(0);
  const [nftTier, setNftTier] = useState(1);
  const [exploitable, setExploitable] = useState(false);
  const [voteForm] = Form.useForm();
  return (
    <Form
      form={voteForm}
      name="voteForm"
      labelCol={{
        span: 8,
      }}
      wrapperCol={{
        span: 16,
      }}
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item label="Royalties in %">
        <InputNumber min={0} max={100} defaultValue={0} onChange={e => setRoyaltiesInBps(e * 100)} />
      </Form.Item>

      <Form.Item label="Your own share in %">
        <InputNumber min={0} max={100} defaultValue={0} onChange={e => setOwnShare(e * 100)} />
      </Form.Item>

      <Form.Item name="nftTier" label="Your NFT Tier" rules={[{ required: true, message: "Please select a Tier!" }]}>
        <Select placeholder="Select a Tier" onChange={value => setNftTier(ethers.BigNumber.from(value))}>
          <Option value="0">Silver</Option>
          <Option value="1">Gold</Option>
          <Option value="2">Platinium</Option>
        </Select>
      </Form.Item>
      <Form.Item name="exploitable" valuePropName="checked">
        <Checkbox onChange={e => setExploitable(e.target.checked)}>
          The buyer has the right to use commercially the musical work
        </Checkbox>
      </Form.Item>
      <Form.Item>
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            try {
              const values = await voteForm.validateFields();
              console.log("Success:", values);
              try {
                const result = tx(agreementContract.vote(royaltiesInBps, ownShare, nftTier, exploitable), updateNotif);

                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
              } catch (e) {
                console.log(e);
              }
            } catch (errorInfo) {
              console.log("Failed:", errorInfo);
            }
            console.log(`${typeof nftTier} with value ${nftTier}`);
          }}
        >
          Cast a vote
        </Button>
      </Form.Item>
    </Form>
  );
}
