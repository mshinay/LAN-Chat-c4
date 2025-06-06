import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const authController = new AuthController(); // 初始化控制器

// 定义路由与控制器方法的绑定
router.post("/wallet-login", authController.walletLogin);
router.post("/nonce", authController.getNonce); // 新增获取 nonce 接口

export default router;
