import React, { useEffect, useState } from "react";
import { GiGuitar, GiMicrophone, GiWallet } from "react-icons/gi";
import { FaFileContract } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
export default function Visualizer({ address }) {
  const users = new Map();
  users.set("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", {
    name: "Rights holder 1",
    icon: <FaFileContract size={70} />,
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  });
  users.set("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", {
    name: "Rights holder 2",
    icon: <FaFileContract size={70} />,
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  });
  users.set("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", {
    name: "Performer - Guitarist",
    icon: <GiGuitar size={70} />,
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  });
  users.set("0x90F79bf6EB2c4f870365E785982E1f101E93b906", {
    name: "Performer - Microphone",
    icon: <GiMicrophone size={70} />,
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  });
  users.set("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", {
    name: "Buyer - NFT Enthusiast",
    icon: <GiWallet size={70} />,
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  });
  users.set("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", {
    name: "Admin - Tyxit collaborator",
    icon: <RiAdminFill size={70} />,
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  });
  return (
    <div>
      {users.get(address) && (
        <>
          <h3>{users.get(address).name}</h3>
          <div>{users.get(address).icon}</div>
        </>
      )}
    </div>
  );
}
