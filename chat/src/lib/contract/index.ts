import { ethers } from "ethers";

import { CONTRACT_ADDRESS, NETWORK } from "./config";
import ABI from './abi.json' assert { type: 'json' };

// 创建与合约的连接
export async function getContractInstance() {
  if (!window.ethereum) {
    throw new Error("MetaMask 未安装！");
  }

  // 请求连接到 MetaMask
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // 创建 provider 和 signer
 // 创建禁用 ENS 的 Provider
 const provider = new ethers.BrowserProvider(window.ethereum);

  const signer = await provider.getSigner();

  // 创建合约实例
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI,signer);

  return contract;
}

// 存储 IPFS CID 到区块链
export async function storeCID(
  cid: string,
  metadata: string,
  receiver: string,
  requiredRole: number
) {
  const contract = await getContractInstance();
  
  if (!ethers.isAddress(receiver)) {
    throw new Error(`receiver 不是合法的以太坊地址: ${receiver}`);
  }
  //const receiverAddress = ethers.getAddress(receiver);
  try {
    // 传递 `cid`, `metadata`, `receiver`, 和 `requiredRole`
    const tx = await contract.storeData(cid, metadata, receiver, requiredRole);
    console.log("发送交易中...");
    await tx.wait(); // 等待交易完成
    console.log("CID 存储成功:", cid);
  } catch (error) {
    console.error("存储 CID 失败: 数据哈希:",cid+"  元数据:" ,metadata+"  接收者:",receiver+"  要求权限",requiredRole,error);
    console.error("cid",receiver)
  }
}



// 检索 IPFS CID 和元数据
export async function retrieveCID(id: number) {
  try {
    const contract = await getContractInstance();

    // 调用合约的 `getData` 方法
    const data = await contract.getData(id);

    console.log("检索到的数据:", data);
    return {
      cid: data.cid,
      metadata: data.metadata,
      uploader: data.uploader,
      receiver: data.receiver, // 新增：返回接收者地址
      requiredRole: data.requiredRole
    };
  } catch (error) {
    console.error("检索 CID 失败:", error);
    throw error;
  }
}

export async function addToACL(dataId: number, userAddress: string) {
  try {
    const contract = await getContractInstance();

    // 调用合约的 `addToACL` 方法
    const tx = await contract.addToACL(dataId, userAddress);
    console.log("添加到 ACL 中...");
    await tx.wait(); // 等待交易完成
    console.log(`用户 ${userAddress} 已被添加到数据 ${dataId} 的 ACL 中`);
  } catch (error) {
    console.error("添加到 ACL 失败:", error);
  }
}

export async function removeFromACL(dataId: number, userAddress: string) {
  try {
    const contract = await getContractInstance();

    // 调用合约的 `removeFromACL` 方法
    const tx = await contract.removeFromACL(dataId, userAddress);
    console.log("从 ACL 中移除...");
    await tx.wait(); // 等待交易完成
    console.log(`用户 ${userAddress} 已从数据 ${dataId} 的 ACL 中移除`);
  } catch (error) {
    console.error("从 ACL 中移除失败:", error);
  }
}

export async function isInACL(dataId: number, userAddress: string): Promise<boolean> {
  try {
    const contract = await getContractInstance();

    // 调用合约的 `isInACL` 方法
    const result = await contract.isInACL(dataId, userAddress);

    console.log(`用户 ${userAddress} 是否在数据 ${dataId} 的 ACL 中:`, result);
    return result;
  } catch (error) {
    console.error("检查 ACL 失败:", error);
    throw error;
  }
}


// 分配用户角色
// enum Role { Admin: 0, Uploader: 1, Viewer: 2 } 
export async function setRole(userAddress: string, role: number) {
  try {
    const contract = await getContractInstance();

    // 调用合约的 `setRole` 方法
    const tx = await contract.setRole(userAddress, role);
    console.log("发送交易中...");
    await tx.wait(); // 等待交易完成
    console.log(`角色分配成功: 用户 ${userAddress} 被授予角色 ${role}`);
  } catch (error) {
    console.error("角色分配失败:", error);
  }
}

// 检查用户角色
export async function hasRole(userAddress: string, requiredRole: number): Promise<boolean> {
  try {
    const contract = await getContractInstance();

    // 调用合约的 `hasRole` 方法
    const result = await contract.hasRole(userAddress, requiredRole);

    console.log(`用户 ${userAddress} 是否拥有角色 ${requiredRole}:`, result);
    return result;
  } catch (error) {
    console.error("检查角色失败:", userAddress,error);
    throw error;
  }
}
