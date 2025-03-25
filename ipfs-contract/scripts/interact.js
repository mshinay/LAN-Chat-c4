//测试脚本
const hre = require("hardhat");

async function main() {
    // 使用已部署合约地址（替换为你实际的地址）
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 默认本地网络第一个地址
    
    // 直接通过地址和ABI连接合约
    const StorageContract = await hre.ethers.getContractFactory("StorageContract");
    const storageContract = StorageContract.attach(contractAddress);

    // 存储数据
    console.log("Storing data...");
    const tx = await storageContract.storeData(
        "bafybeigdyrztpjhs6zfxg74zjh4ofkpddj7vm4hkks5isokwnrya4cq4xe",
        "Example metadata"
    );
    await tx.wait();
    console.log("Data stored on-chain!");

    // 检索数据
    const data = await storageContract.getData(0);
    console.log("Retrieved data:", {
        cid: data[0],
        metadata: data[1]
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });