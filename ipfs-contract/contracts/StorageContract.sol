// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract StorageContract {
    struct CIDData {
        string cid;
        string metadata;
        address uploader;
        address receiver; // 新增：接收者地址
        Role requiredRole;
    }

    enum Role { Admin, Uploader, Viewer }

    mapping(address => Role) public roles; // 用户角色
    mapping(uint256 => CIDData) public storedData; // 数据存储
    mapping(uint256 => mapping(address => bool)) public globalACL; // 全局 ACL，按数据 ID 和地址维护
    uint256 public dataCount; // 数据计数

    // 事件
    event DataStored(uint256 indexed id, string cid, string metadata, address uploader, address receiver);
    event RoleGranted(address indexed user, Role role);
    event AccessGranted(uint256 indexed dataId, address indexed user);
    event AccessRevoked(uint256 indexed dataId, address indexed user);

    // 构造函数：部署者默认为 Admin
    constructor() {
        roles[msg.sender] = Role.Admin;
    }

    // 自定义错误（更高效）
    error InsufficientRole(uint256 have, uint256 required);

    // 修饰符：检查角色
    modifier onlyRole(Role requiredRole) {
        if (uint(roles[msg.sender]) > uint(requiredRole)) {
            revert InsufficientRole(uint(roles[msg.sender]), uint(requiredRole));
        }
        _;
    }

    // 数据存储（Uploader 及以上权限可调用）
    function storeData(
        string memory cid, 
        string memory metadata, 
        address receiver,
        Role requiredRole
    ) public onlyRole(Role.Uploader) {
        // 创建新数据并存储
        storedData[dataCount] = CIDData({
            cid: cid,
            metadata: metadata,
            uploader: msg.sender,
            receiver: receiver,
            requiredRole: requiredRole
        });

        // 默认允许上传者和接收者访问
        globalACL[dataCount][msg.sender] = true;
        globalACL[dataCount][receiver] = true;

        emit DataStored(dataCount, cid, metadata, msg.sender, receiver);
        dataCount++;
    }

    // 获取数据（检查全局 ACL 或角色权限）
    function getData(uint256 id) public view returns (string memory, string memory, address, address, Role) {
        require(id < dataCount, "Invalid data ID");

        CIDData memory data = storedData[id];

        // 检查全局 ACL 或角色权限
        require(
           roles[msg.sender] == Role.Admin|| globalACL[id][msg.sender] && uint(roles[msg.sender]) <= uint(data.requiredRole), 
            "Access denied"
        );

        return (data.cid, data.metadata, data.uploader, data.receiver, data.requiredRole);
    }

    // 授予访问权限（仅限 Uploader 或 Admin）
    function grantAccess(uint256 dataId, address user) public {
        require(dataId < dataCount, "Invalid data ID");

        CIDData memory data = storedData[dataId];

        // 仅允许 Admin 或 Uploader 修改 ACL
        require(
            msg.sender == data.uploader || roles[msg.sender] == Role.Admin,
            "Only uploader or Admin can grant access"
        );

        globalACL[dataId][user] = true;
        emit AccessGranted(dataId, user);
    }

    // 撤销访问权限（仅限 Admin）
    function revokeAccess(uint256 dataId, address user) public onlyRole(Role.Admin) {
        require(dataId < dataCount, "Invalid data ID");

        // 确保地址存在于 ACL 中
        require(globalACL[dataId][user], "Address does not have access");

        globalACL[dataId][user] = false;
        emit AccessRevoked(dataId, user);
    }

    // 设置用户角色（仅限 Admin）
    function setRole(address user, Role role) public onlyRole(Role.Admin) {
        roles[user] = role;
        emit RoleGranted(user, role);
    }

    // 检查角色是否有足够权限
    function hasRole(address user, Role requiredRole) public view returns (bool) {
        return uint(roles[user]) <= uint(requiredRole);
    }

    // 检查全局 ACL
    function hasAccess(uint256 dataId, address user) public view returns (bool) {
        require(dataId < dataCount, "Invalid data ID");
        return globalACL[dataId][user];
    }
}
