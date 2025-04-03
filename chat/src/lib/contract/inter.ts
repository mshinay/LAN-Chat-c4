import { ethers } from "ethers";
import { CONTRACT_ADDRESS, NETWORK } from "./config";
import ABI from './abi.json' assert { type: 'json' };

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // 本地 Hardhat RPC

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// 查询数据
export async function getData(id: number) {
  try {
    const data = await contract.getData(id);
    console.log(`CID: ${data[0]}`);
    console.log(`Metadata: ${data[1]}`);
    console.log(`Uploader: ${data[2]}`);
    console.log(`Receiver: ${data[3]}`);
    console.log(`Required Role: ${data[4].toString()}`);
  } catch (error) {
    console.error("查询数据失败:", error);
  }
}

//fetchData(0);  // 查询 ID = 0 的数据
