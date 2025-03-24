import { uploadMessageToIPFS, uploadFileToIPFS, getIPFSUrl, fetchFromIPFS } from "@/lib/ipfs/helia";

export interface ChatMessage {
  content: string; // 消息内容
  url: string;     // IPFS 公共网关 URL
}

// 上传消息到 IPFS，并返回存储信息
export async function sendMessageToIPFS(message: string): Promise<ChatMessage> {
  if (!message.trim()) {
    throw new Error("消息内容不能为空！");
  }

  try {
    const cid = await uploadMessageToIPFS(message.trim());
    const url = getIPFSUrl(cid);

    console.log("消息已上传到 IPFS：", { content: message, cid, url });
    return { content: message, url };
  } catch (error) {
    console.error("发送消息到 IPFS 失败：", error);
    throw error;
  }
}

// 上传文件到 IPFS，并返回存储信息
export async function uploadFileToIPFSService(file: File): Promise<{ cid: string; url: string }> {
  if (!file) {
    throw new Error("文件不能为空！");
  }

  try {
    const cid = await uploadFileToIPFS(file);
    const url = getIPFSUrl(cid);

    console.log("文件已上传到 IPFS：", { cid, url });
    return { cid, url };
  } catch (error) {
    console.error("文件上传到 IPFS 失败：", error);
    throw error;
  }
}

// 从 IPFS 获取数据
export async function fetchMessageFromIPFS(cid: string): Promise<string> {
  try {
    const content = await fetchFromIPFS(cid);
    console.log("从 IPFS 获取的数据：", content);
    return content;
  } catch (error) {
    console.error("从 IPFS 获取数据失败：", error);
    throw error;
  }
}
