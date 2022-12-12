import React from "react";
import { Button, Select, Form, Checkbox, InputNumber } from "antd";
import { useState } from "react";
import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import { States } from "./Agreement";
import { updateNotif } from "../../helpers/helperFunctions.jsx";

const { Option } = Select;

export default function VoteForm({ readContracts, address, tx, agreementContract, agreementState, redeemAmount }) {
  const onFinish = values => {
    console.log("Success:", values);
  };
  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const artistContract = useContractReader(readContracts, "FactoryCloneArtist", "artistToContract", [address], 5);
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
        {agreementState === States.Initialized && (
          <>
            <Button
              style={{ marginTop: 8 }}
              onClick={async () => {
                try {
                  const values = await voteForm.validateFields();
                  console.log("Success:", values);
                  try {
                    console.log(`royaltiesInBps ${royaltiesInBps}`);
                    console.log(`ownShare ${ownShare}`);
                    console.log(`nftTier ${nftTier}`);
                    console.log(`exploitable ${exploitable}`);
                    console.log(`artistContract ${artistContract}`);

                    const result = tx(
                      agreementContract.vote(royaltiesInBps, ownShare, nftTier, exploitable, artistContract),
                      updateNotif,
                    );

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
            <Button
              style={{ marginTop: 8 }}
              onClick={async () => {
                try {
                  const result = tx(agreementContract.putForSale(), updateNotif);

                  console.log("awaiting metamask/web3 confirm result...", result);
                  console.log(await result);
                } catch (e) {
                  console.log(e);
                }
              }}
            >
              Open the sale
            </Button>
          </>
        )}
        {(agreementState === States.Redeemable || agreementState === States.Canceled) && redeemAmount > 0 && (
          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              try {
                if (artistContract) {
                  const result = tx(agreementContract.redeem_artist(artistContract), updateNotif);
                  console.log("awaiting metamask/web3 confirm result...", result);
                  console.log(await result);
                }
              } catch (e) {
                console.log(e);
              }
            }}
          >
            Redeem your benefits
          </Button>
        )}
      </Form.Item>
    </Form>
  );
}
