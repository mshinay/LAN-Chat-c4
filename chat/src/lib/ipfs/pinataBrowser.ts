/**
 * 使用 Pinata 的 HTTP API 在浏览器环境中上传文件
 * @param file - 要上传的文件
 * @returns 返回文件的 CID
 */
export async function uploadToPinata(file: File): Promise<string> {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_API_SECRET;
  
    const formData = new FormData();
    formData.append('file', file);
  
    const metadata = JSON.stringify({
      name: file.name,
        uploadedBy: 'LAN-Chat',
        timestamp: `${Date.now()}`,
    
    });
  
    formData.append('pinataMetadata', metadata);
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${btoa(`${apiKey}:${apiSecret}`)}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Failed to upload file to Pinata: ${response.statusText}`);
      }
  
      const result = await response.json();
      return result.IpfsHash; // 返回 CID
    } catch (error) {
      throw new Error(`Failed to upload file to Pinata in browser: ${(error as Error).message}`);
    }
  }
  