import pinataSDK from '@pinata/sdk';

const pinata = new pinataSDK(process.env.PINATA_API_KEY,
    process.env.PINATA_API_SECRET);

/**
 * 使用 Pinata SDK 在 Node.js 环境中上传文件
 * @param file - 要上传的文件
 * @returns 返回文件的 CID
 */
export async function uploadToPinata(file: File): Promise<string> {
  const readableStream = file.stream();

  try {
    const response = await pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: {
        name: file.name,
          uploadedBy: 'LAN-Chat',
          timestamp: `${Date.now()}`,

      },
      pinataOptions: {
        cidVersion: 1,
      },
    });
    return response.IpfsHash;
  } catch (error) {
    throw new Error(`Failed to upload file to Pinata in Node.js: ${(error as Error).message}`);
  }
}
