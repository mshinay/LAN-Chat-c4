// server/src/controllers/ipfs.controller.ts

import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.pinataconfig' }); // 明确指定文件路径


// Pinata API 密钥
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

export const uploadToPinata = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件上传' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname); // 添加文件数据

    // 添加 Pinata 元数据
    formData.append(
      'pinataMetadata',
      JSON.stringify({
        name: req.file.originalname,
        uploadedBy: req.body.uploader,
        receiverId: req.body.receiverId,
        timestamp: new Date().toISOString(),
      })
    );

    // 添加 Pinata 选项
    formData.append(
      'pinataOptions',
      JSON.stringify({
        cidVersion: 1,
      })
    );

    // 调用 Pinata API
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    res.json(response.data); // 返回 Pinata 响应（包括 CID）
  } catch (error) {
    console.error('文件上传失败666:', error);
    /* console.log('Pinata API Key:', PINATA_API_KEY);
console.log('Pinata API Secret:', PINATA_API_SECRET);
console.log('Form Data File:', req.file.buffer.toString('utf-8'));
console.log('Form Data Metadata:', JSON.stringify({
  name: req.file.originalname,
  uploadedBy: 'LAN-Chat',
  timestamp: new Date().toISOString(),
})); */
console.log('Form Data Options:', JSON.stringify({ cidVersion: 1 }));

    res.status(500).json({ error: '文件上传失败'+PINATA_JWT, details: (error as Error).message  });
  }
};
