import { ref } from "vue";
import Web3 from "web3";
import { useUserStore } from "@/stores/user";

// 用于扩展 `window` 对象的类型声明
declare global {
  interface Window {
    ethereum?: any; // MetaMask 注入的 `ethereum` 对象
  }
}

export function useMetaMask() {
  const walletAddress = ref<string | null>(null);
  const userStore = useUserStore();

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("请安装 MetaMask 扩展");
      return;
    }
  
    const web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.requestAccounts();
    const address = accounts[0];
    walletAddress.value = address;
    localStorage.setItem("walletAddress", address);
  
    try {
      // 第一步：请求后端获取 nonce
      const nonceRes = await fetch("http://localhost:3000/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
  
      const nonceData = await nonceRes.json();
      const nonce = nonceData.nonce;
      const message = `Login to LAN-Chat: ${nonce}`;
  
      // 第二步：使用 MetaMask 签名 nonce
      const signature = await web3.eth.personal.sign(message, address, "");
  
      // 第三步：发送签名到后端验证
      const res = await fetch("http://localhost:3000/api/auth/wallet-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
  
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("jwt", data.token); // 存储 JWT
        userStore.setWalletAddress(address); // 更新用户状态
        console.log("✅ 登录成功:", data.token);
      } else {
        console.error("❌ 登录失败:", data.error);
      }
    } catch (err) {
      console.error("❌ 登录异常:", err);
    }
  };

  return { walletAddress, connectWallet };
}
