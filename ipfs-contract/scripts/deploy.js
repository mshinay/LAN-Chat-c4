const fs = require("fs");
const path = require("path");

async function main() {
  // 获取合约工厂
  const StorageContract = await hre.ethers.getContractFactory("StorageContract");
  console.log("Deploying StorageContract...");

  // 部署合约
  const storageContract = await StorageContract.deploy();
  await storageContract.waitForDeployment();
  
  //查看合约部署者
  const [deployer] = await ethers.getSigners(); // 获取部署合约的钱包地址
  console.log("合约部署者地址:", deployer.address); // 打印出合约的部署者
   // 获取本地账户：第一个是部署者，后面的是其他账号
  const accounts = await hre.ethers.getSigners();

  // 获取部署地址
  const deployedAddress = await storageContract.getAddress();
  console.log("StorageContract deployed to:", deployedAddress);

   // ✅ 设置 accounts[1] 到 accounts[19] 为 Uploader 角色（1）
  for (let i = 1; i <= 19; i++) {
    const addr = accounts[i].address;
    const tx = await storageContract.connect(deployer).setRole(addr, 1); // 1 = Uploader
    await tx.wait();
    console.log(`设置账户 ${addr} 为 Uploader`);
  }

  // 获取合约 ABI
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/StorageContract.sol/StorageContract.json");
  const abiDestination = path.resolve(__dirname, "../../chat/src/lib/contract/abi.json"); // 前端 ABI 文件位置

  // 将 ABI 写入前端项目
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  fs.writeFileSync(abiDestination, JSON.stringify(artifact.abi, null, 2));
  console.log("ABI 文件已更新到前端项目:", abiDestination);


   // 写入到配置文件
   const configPath = path.join(__dirname, "../../chat/src/lib/contract/config.ts");
     const configContent = `export const CONTRACT_ADDRESS = "${deployedAddress}"
export const NETWORK = {
  name: "localhost",
  chainId: 1337, // Hardhat 本地网络的默认 Chain ID
  rpcUrl: "http://127.0.0.1:8545", // Hardhat 本地网络的默认 RPC 地址
};`;
        fs.writeFileSync(configPath, configContent);
    console.log("CONTRACT_ADDRESS已更新到前端");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
