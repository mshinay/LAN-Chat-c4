// server/src/routes/ipfs.routes.ts

import { Router } from 'express';
import multer from 'multer';
import { uploadToPinata } from '../controllers/ipfs.controller';

const router = Router();
const upload = multer(); // 用于解析上传的文件

// 文件上传到 Pinata
router.post('/upload', upload.single('file'), uploadToPinata);

export default router;
