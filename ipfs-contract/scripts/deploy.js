const fs = require("fs");
const path = require("path");

async function main() {
  const StorageContract = await hre.ethers.getContractFactory("StorageContract");
  console.log("Deploying StorageContract...");

  const storageContract = await StorageContract.deploy();
  await storageContract.waitForDeployment();

  const deployedAddress = await storageContract.getAddress();
  console.log("StorageContract deployed to:", deployedAddress);

  // 获取合约 ABI
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/StorageContract.sol/StorageContract.json");
  const abiDestination = path.resolve(__dirname, "../../chat/src/lib/contract/abi.json"); // 前端 ABI 文件位置

  // 将 ABI 写入前端项目
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  fs.writeFileSync(abiDestination, JSON.stringify(artifact.abi, null, 2));
  console.log("ABI 文件已更新到前端项目:", abiDestination);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
