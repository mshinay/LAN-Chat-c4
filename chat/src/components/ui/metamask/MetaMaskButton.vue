<script setup>
import { useMetaMask } from "@/hooks/useMetaMask";

const { walletAddress, connectWallet } = useMetaMask();
</script>

<template>
  <button @click="connectWallet" class="bg-blue-500 text-white px-4 py-2 rounded">
    {{ walletAddress ? `已连接: ${walletAddress}` : "连接 MetaMask" }}
  </button>
</template>
