import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { MemoryBlockstore } from "blockstore-core";
import { CID } from 'multiformats/cid';

// 初始化 Helia 客户端
const createHeliaClient = async () => {
    // 使用内存存储（适合前端）
    const blockstore = new MemoryBlockstore();

    // 创建 Helia 客户端
    const helia = await createHelia({ blockstore });

    // UnixFS 模块用于处理文件
    const fs = unixfs(helia);

    console.log("Helia 客户端已初始化");
    return { helia, fs };
};




// 上传文本到 IPFS
export async function uploadMessageToIPFS(message: string): Promise<string> {
    const { fs } = await createHeliaClient();

    // 将文本消息转换为字节并上传到 IPFS
    const cid = await fs.addBytes(new TextEncoder().encode(message));
    console.log("消息已上传到 IPFS，CID:", cid.toString());
    return cid.toString();
}

// 上传文件到 IPFS
export async function uploadFileToIPFS(file: File): Promise<string> {
    const { fs } = await createHeliaClient();

    // 将文件转换为字节并上传到 IPFS
    const fileContent = new Uint8Array(await file.arrayBuffer());
    const cid = await fs.addBytes(fileContent);
    console.log("文件已上传到 IPFS，CID:", cid.toString());
    return cid.toString();
}

// 构造 IPFS 公共网关的 URL
export function getIPFSUrl(cid: string): string {
    return `https://ipfs.io/ipfs/${cid}`;
}

// 从 IPFS 下载数据
export async function fetchFromIPFS(cid: string): Promise<string> {
    try {
        const { fs } = await createHeliaClient();

        // 将字符串 CID 转换为 CID 对象
        const cidObj = CID.parse(cid);

        // 从 IPFS 中获取数据
        const data = [];
        for await (const chunk of fs.cat(cidObj)) {
            data.push(chunk);
        }

        // 合并 Uint8Array 并解码为字符串
        const mergedArray = new Uint8Array(
            data.reduce<number[]>((acc, chunk) => acc.concat(Array.from(chunk)), [])
          );
        const content = new TextDecoder().decode(mergedArray);

        console.log('从 IPFS 获取的数据:', content);
        return content;
    } catch (error) {
        console.error('从 IPFS 获取数据失败:', error);
        throw error;
    }
}


export default createHeliaClient;