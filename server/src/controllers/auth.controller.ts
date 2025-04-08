import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyMessage } from "../utils/crypto"; // 验证签名的工具函数
import { generateNonce, saveNonce, getNonce, clearNonce } from "../utils/nonceStore";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // 从环境变量中读取

export class AuthController {
  // 获取 nonce
  getNonce = (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Missing address" });
    }

    const nonce = generateNonce();
    saveNonce(address, nonce);
    res.json({ nonce });
  };

  // 登录验证：签名 + nonce
  walletLogin = (req: Request, res: Response) => {
    const { address, signature } = req.body;

    if (!address || !signature) {
      return res.status(400).json({ success: false, error: "Missing address or signature" });
    }

    const nonce = getNonce(address);
    if (!nonce) {
      return res.status(400).json({ success: false, error: "Nonce not found or expired" });
    }

    const message = `Login to LAN-Chat: ${nonce}`;
    const isValid = verifyMessage(message, signature, address);

    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    clearNonce(address); // nonce 一次性使用

    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token });
  };
}

