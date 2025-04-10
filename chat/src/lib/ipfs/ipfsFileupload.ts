import { storeCID } from "@/lib/contract"; // 用于与区块链交互
import {UserRoles} from '@/common/contract/constant';
export interface IPFSUploadResult {
    cid: string
    gatewayUrl: string
  }
  
  export async function uploadToIPFS(file: Blob, {
    fileName,
    uploader,
    receiverId
  }: {
    fileName: string
    uploader: string
    receiverId: string
  }): Promise<{ cid: string, gatewayUrl: string }> {
    const formData = new FormData()
    formData.append('file', new File([file], fileName))
    formData.append('uploader', uploader)
    formData.append('receiverId', receiverId)
  
    const res = await fetch('http://localhost:3000/api/ipfs/upload', {
      method: 'POST',
      body: formData
    })
  
    if (!res.ok) {
      throw new Error(`IPFS 上传失败: ${await res.text()}`)
    }
  
    const result = await res.json()
    const cid = result.IpfsHash
     // 2. 将 CID 存储到区块链
     await storeCID(cid,`File|${new Date().toISOString()}`,receiverId!,UserRoles.UPLOADER); // 调用区块链交互逻辑，存储 CID 和类型
    return {
      cid,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`
    }
  }
  