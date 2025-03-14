# LAN-Chat

LAN-Chat 是一个基于 WebRTC 和 WebSocket 的局域网聊天应用，支持文本消息、点对点通信和多用户聊天室。

## 功能特点

- **局域网通信**：无需互联网连接，在局域网内即可使用
- **实时消息**：基于 WebSocket 的实时消息传递
- **点对点通信**：使用 WebRTC 进行直接的点对点通信
- **多用户聊天**：支持多人同时在线聊天
- **响应式设计**：适配桌面和移动设备
- **深色/浅色主题**：支持主题切换
- **离线支持**：本地存储聊天历史
- **自动重连**：网络中断时自动尝试重新连接

## 技术栈

### 前端

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (状态管理)
- Socket.io-client (WebSocket 客户端)
- WebRTC (点对点通信)
- TailwindCSS (样式)
- Vitest (测试框架)

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
git clone https://github.com/yourusername/LAN-Chat.git
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

## 开发

### 构建前端

```bash
cd chat
npm run build
```

### 运行测试

```bash
cd chat
npm run test
```

### 分析构建

```bash
cd chat
npm run analyze
```

## 许可证

MIT
