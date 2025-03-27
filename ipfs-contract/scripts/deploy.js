const fs = require("fs");
const path = require("path");

async function main() {
  // 获取合约工厂
  const StorageContract = await hre.ethers.getContractFactory("StorageContract");
  console.log("Deploying StorageContract...");

  // 部署合约
  const storageContract = await StorageContract.deploy();
  await storageContract.waitForDeployment();

  // 获取部署地址
  const deployedAddress = await storageContract.getAddress();
  console.log("StorageContract deployed to:", deployedAddress);

  // 获取合约 ABI
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/StorageContract.sol/StorageContract.json");
  const abiDestination = path.resolve(__dirname, "../../chat/src/lib/contract/abi.json"); // 前端 ABI 文件位置

  // 将 ABI 写入前端项目
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  fs.writeFileSync(abiDestination, JSON.stringify(artifact.abi, null, 2));
  console.log("ABI 文件已更新到前端项目:", abiDestination);


   // 写入到配置文件
   const configPath = path.join(__dirname, "../chat/src/lib/contract/config.ts");
     const configContent = `
        export const CONTRACT_ADDRESS = "${deployedAddress}"`;
    console.log("CONTRACT_ADDRESS已更新到前端");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
