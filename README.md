# LAN-Chat

LAN-Chat 是一个基于 WebRTC 和 WebSocket 的局域网聊天应用，支持文本消息、点对点通信和多用户聊天室。

![image-20250317145756326](/Users/hanlinfei/Library/Application Support/typora-user-images/image-20250317145756326.png)

![image-20250317145835957](/Users/hanlinfei/Library/Application Support/typora-user-images/image-20250317145835957.png)

![image-20250317150303280](/Users/hanlinfei/Library/Application Support/typora-user-images/image-20250317150303280.png)



## 功能特点

- **局域网通信**：无需互联网连接，在局域网内即可使用
- **多设备支持**：局域网内设备均可
- **实时消息**：基于 WebSocket 的实时消息传递
- **点对点通信**：使用 WebRTC 进行直接的点对点通信
- **多用户聊天**：支持多人同时在线聊天
- **隐私问题**：无需担心隐私问题，数据均为点对点传输
- **文件传输**：支持点对点文件在线传输
- **响应式设计**：适配桌面和移动设备
- **深色/浅色主题**：支持主题切换

## 技术栈

### 前端

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (状态管理)
- Socket.io-client (WebSocket 客户端)
- WebRTC (点对点通信)
- TailwindCSS (样式)

### 后端

- Node.js
- Express
- TypeScript
- Socket.io (WebSocket 服务器)
- Winston (日志)

## 快速开始

### 前提条件

- Node.js 18+
- npm 或 yarn

### 安装和运行

1. 克隆仓库

```bash
git clone https://github.com/HanLinfei/LAN-Chat.git
cd LAN-Chat
```

2. 安装依赖并启动后端

```bash
cd server
npm install
npm run dev
```

3. 安装依赖并启动前端

```bash
cd ../chat
npm install
npm run dev
```

4. 在浏览器中访问

```
http://localhost:5173
```

### 项目部署

```bash
cd LAN-Chat/chat
npm install
cd ../server
npm install
npm run start
```

## 许可证

MIT
