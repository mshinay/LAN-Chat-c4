<template>
  <div class="h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
          <h2 class="mb-4 text-lg font-semibold">欢迎使用 Vehicle-communication</h2>
          <p class="mb-8 text-gray-600">请通过 MetaMask 登录以继续</p>
          <button
              @click="handleLogin"
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md"
          >
              连接 MetaMask
          </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserStore } from "@/stores/user";

const { connectWallet } = useMetaMask();
const userStore = useUserStore();

async function handleLogin() {
  try {
      await connectWallet(); // MetaMask 登录

      const walletAddress = localStorage.getItem("walletAddress"); // 从 localStorage 获取钱包地址
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      if (walletAddress) {
          await userStore.initCurrentUser(walletAddress); // 初始化用户状态
          console.log("当前用户状态:", userStore.currentUser); // 调试输出
          
         
        
          //await delay(500000);    
    window.location.href = "/chat"; // 跳转到聊天页面


      } else {
          throw new Error("钱包地址未找到");
      }
  } catch (error) {
      console.error("登录失败:", error);
      alert("连接 MetaMask 出错，请重试！");
  }
}

</script>

<style scoped>
h2 {
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
