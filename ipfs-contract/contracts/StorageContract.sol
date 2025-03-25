// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract StorageContract {
    struct CIDData {
        string cid;
        string metadata;
        address uploader;
    }

    mapping(uint256 => CIDData) public storedData;
    uint256 public dataCount;

    event DataStored(uint256 indexed id, string cid, string metadata, address uploader);

    function storeData(string memory cid, string memory metadata) public {
        storedData[dataCount] = CIDData(cid, metadata, msg.sender);
        emit DataStored(dataCount, cid, metadata, msg.sender);
        dataCount++;
    }

    function getData(uint256 id) public view returns (CIDData memory) {
        require(id < dataCount, "Data does not exist.");
        return storedData[id];
    }
}
