import { Button, Form, InputNumber, Select } from "antd";
import { ethers } from "ethers";
import React, { useState } from "react";

const { Option } = Select;

export default function PreconditionsForm({ tx, artistContract }) {
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

  const [minimalRoyaltiesInBps, setMinimalRoyaltiesInBps] = useState(0);
  const [minimalTier, setMinimalTier] = useState(0);
  const [preconditionsForm] = Form.useForm();

  return (
    <Form
      form={preconditionsForm}
      name="preconditionsForm"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item label="Minimal royalties in %">
        <InputNumber min={0} max={100} defaultValue={0} onChange={e => setMinimalRoyaltiesInBps(e * 100)} />
      </Form.Item>

      <Form.Item name="nftTier" label="Minimal NFT Tier" rules={[{ required: true, message: "Please select a Tier!" }]}>
        <Select placeholder="Select a Tier" onChange={value => setMinimalTier(ethers.BigNumber.from(value))}>
          <Option value="0">Silver</Option>
          <Option value="1">Gold</Option>
          <Option value="2">Platinium</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            try {
              const values = await preconditionsForm.validateFields();
              console.log("Success:", values);
              try {
                const result = tx(artistContract.setPreconditions(minimalRoyaltiesInBps, minimalTier), updateNotif);
              } catch (e) {
                console.log(e);
              }
            } catch (errorInfo) {
              console.log("Failed:", errorInfo);
            }
          }}
        >
          Cast a vote
        </Button>

        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            try {
              const result = tx(artistContract.withdraw(), updateNotif);
            } catch (errorInfo) {
              console.log("Failed:", errorInfo);
            }
          }}
        >
          Get your due royalties
        </Button>
      </Form.Item>
    </Form>
  );
}
