// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract StorageContract {
    struct CIDData {
        string cid;
        string metadata;
        address uploader;
    }

    struct ACL { //访问控制列表
        address user;
        bool canAccess;
    }

    enum Role { Admin, Uploader, Viewer }   //不同权限的角色

    mapping(address => string) public userDIDs; // 用户地址到DID的映射

    mapping(address => Role) public roles;  //用户地址到权限的映射

    mapping(uint256 => CIDData) public storedData; //映射上链CID

    mapping(uint256 => ACL[]) public dataACL; // 每个数据ID的ACL列表

    uint256 public dataCount;

    event DataStored(uint256 indexed id, string cid, string metadata, address uploader);

    function storeData(string memory cid, string memory metadata,Role requiredRole) public {
       require(hasRole(msg.sender, Role.Uploader), "Not authorized to upload");
    
        // 存储数据
        storedData[dataCount] = CIDData(cid, metadata, msg.sender, requiredRole);
        emit DataStored(dataCount, cid, metadata, msg.sender);
        dataCount++;
    }

    function getData(uint256 id) public view returns (CIDData memory) {
         CIDData memory data = storedData[dataId];
        require(hasRole(msg.sender, data.requiredRole), "Access denied");
        return data;
    }

    // 注册 DID
    function registerDID(string memory did) public {
        userDIDs[msg.sender] = did;
        emit DIDRegistered(msg.sender, did);
    }

    // 检查上传者是否已注册 DID
    function verifyUploader(address uploader) internal view returns (bool) {
        return bytes(userDIDs[uploader]).length > 0; // 检查是否绑定 DID
    }

    event DIDRegistered(address indexed user, string did);

    // 添加 ACL 权限
    function addAccess(uint256 dataId, address user) public {
        require(msg.sender == owner, "Only owner can set ACL");
        dataACL[dataId].push(ACL(user, true));
    }

    // 验证权限
    function hasAccess(uint256 dataId, address user) public view returns (bool) {
        ACL[] memory aclList = dataACL[dataId];
        for (uint256 i = 0; i < aclList.length; i++) {
            if (aclList[i].user == user && aclList[i].canAccess) {
                return true;
            }
        }
        return false;
    }

    // 设置角色
    function setRole(address user, Role role) public onlyOwner {
        roles[user] = role;
    }

    // 检查角色
    function hasRole(address user, Role role) public view returns (bool) {
        return roles[user] == role;
    }

}
