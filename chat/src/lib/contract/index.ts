import { ethers } from "ethers";
import { Interface } from 'ethers';
import { CONTRACT_ADDRESS, NETWORK } from "./config";
import ABI from './abi.json' assert { type: 'json' }
//import { BrowserProvider } from "ethers";

// 创建与合约的连接
export async function getContractInstance() {
  if (!window.ethereum) {
    throw new Error("MetaMask 未安装！");
  }

  // 请求连接到 MetaMask
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // 创建 provider 和 signer
  //const provider = new ethers.providers.Web3Provider(window.ethereum);
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = provider.getSigner();

  // 创建合约实例
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, await signer);

  return contract;
}

// 存储 IPFS CID 到区块链
export async function storeCID(cid: string,metadata: string) {
  const contract = await getContractInstance();
  const tx = await contract.storeData(cid,metadata);
  await tx.wait(); // 等待交易完成
  console.log("CID 存储成功:", cid);
}

// 从区块链检索 IPFS CID
export async function retrieveCID(): Promise<string> {
  const contract = await getContractInstance();
  const cid = await contract.retrieveData();
  console.log("检索到的 CID:", cid);
  return cid;
}
