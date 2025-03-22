import { Router } from "express";
import { verifyMessage } from "../utils/crypto"; // 签名验证函数
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = "your_jwt_secret"; // ⚠️ 用环境变量存储

router.post("/wallet-login", (req, res) => {
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
});

export default router;
