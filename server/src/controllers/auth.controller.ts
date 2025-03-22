import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyMessage } from "../utils/crypto"; // 验证签名的工具函数

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // 从环境变量中读取

export class AuthController {
  // MetaMask 登录：验证签名并返回 JWT
  walletLogin = (req: Request, res: Response) => {
    const { address, signature } = req.body;

    if (!address || !signature) {
      return res.status(400).json({ success: false, error: "Missing address or signature" });
    }

    // 验证签名
    const isValid = verifyMessage("Login to LAN-Chat", signature, address);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid signature" });
    }

    // 生成 JWT
    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token });
  };
}
