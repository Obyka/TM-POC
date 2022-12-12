import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Space } from "antd";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { Address } from "../";
import { updateNotif } from "../../helpers/helperFunctions.jsx";

export default function CreateArtist({ address, tx, readContracts, writeContracts, mainnetProvider }) {
  const [rightHolders, setRightHolders] = useState([address]);
  const [shares, setShares] = useState([100]);
  const [deploying, setDeploying] = useState(false);
  const [validData, setValidData] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    console.log(`Shares: ${shares}`);
    console.log(`rightHolders: ${rightHolders}`);
  }, [shares, rightHolders]);

  return (
    <Card title="Create your adhesion contract" style={{ maxWidth: 600, margin: "auto", marginTop: 10 }}>
      <Address address={writeContracts.FactoryCloneArtist.address} ensProvider={mainnetProvider} fontSize={15} />
      <Form form={createForm} layout="vertical" style={{ marginTop: 10 }}>
        <Form.List name="rightsHolders">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{
                    display: "flex",
                    marginBottom: 8,
                  }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "address"]}
                    rules={[
                      {
                        required: true,
                        message: "Missing rights holders address",
                      },
                    ]}
                  >
                    <Input
                      onChange={e => {
                        if (!ethers.utils.isAddress(e.target.value)) {
                          setValidData(false);
                        } else {
                          setValidData(true);
                        }
                      }}
                      placeholder="Address"
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "share"]}
                    rules={[
                      {
                        required: true,
                        message: "Missing share",
                      },
                    ]}
                  >
                    <InputNumber placeholder="Shares in %" min={1} max={100} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add field
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Button
          disabled={!validData}
          loading={deploying}
          style={{ marginTop: 8 }}
          onClick={async () => {
            try {
              await createForm.validateFields();
              const values = createForm.getFieldsValue();
              setRightHolders(values.rightsHolders.map(elem => elem.address));
              setShares(values.rightsHolders.map(elem => elem.share * 100));
              try {
                const result = tx(writeContracts.FactoryCloneArtist.createArtist(rightHolders, shares), updateNotif);

                console.log("awaiting metamask/web3 confirm result...", result);
                console.log(await result);
                //setDeploying(true);
              } catch (e) {
                setDeploying(false);
                console.log(e);
              }
            } catch (e) {
              console.log(`Error`);
              setDeploying(false);
            }
          }}
        >
          Create your adhesion contract
        </Button>
      </Form>
    </Card>
  );
}
