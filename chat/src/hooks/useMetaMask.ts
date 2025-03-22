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
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    walletAddress.value = accounts[0];

    // 使用钱包地址生成签名
    const message = "Login to LAN-Chat";
    const signature = await web3.eth.personal.sign(message, walletAddress.value!, "");

    // 发送到后端验证
    const res = await fetch("http://localhost:3000/api/auth/wallet-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletAddress.value, signature }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem('jwt',data.token);
      console.log("登录成功:", data.token);
      userStore.setWalletAddress(walletAddress.value!); // 更新用户状态
      localStorage.setItem("jwt", data.token); // 存储 JWT
    } else {
      console.error("登录失败:", data.error);
    }
  };

  return { walletAddress, connectWallet };
}
