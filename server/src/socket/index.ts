import { Server, Socket } from 'socket.io';
import { User } from '../types/user';
import { SocketEvents } from '../types/socket';
import { Services } from '../services';
import { logger } from '../utils/logger';
import jwt from "jsonwebtoken";

const JWT_SECRET = "your_jwt_secret";


export const setupSocketIO = (io: Server, services: Services) => {
    const { userService } = services;
   

    logger.info('Setting up Socket.IO server');


    // 用户加入连接
    io.on(SocketEvents.Connection, (socket: Socket) => {
        logger.debug(`New connection: ${socket.id}`);

        const token = socket.handshake.query.token as string;
          // 验证 JWT
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
        console.log(`User connected: ${decoded.address}`);
        socket.data.address = decoded.address; // 将钱包地址绑定到连接
      } catch (err) {
        console.error("Invalid JWT");
        socket.disconnect(); // 如果验证失败，断开连接
        return;
      }
      
        // 客户端立即发送用户加入连接
        socket.on(SocketEvents.UserJoin, (user: User) => {
            const userData = { ...user, isOnline: true };
            userService.addUser(socket.id, userData);
            // 通知全部客户端更新在线列表
            io.emit(SocketEvents.UsersUpdate, {
                type: "add",
                onlineUsers: userService.getOnlineUsers(),
                user: userData
            });
            logger.info(`User joined: ${user.name} (${socket.id})`);
        });

        // 客户端断开连接
        socket.on(SocketEvents.Disconnect, () => {
            io.emit(SocketEvents.UsersUpdate, {
                type: "remove",
                onlineUsers: userService.getOnlineUsers(),
                user: userService.getUser(socket.id)
            });
            userService.removeUser(socket.id);
            logger.info(`User disconnected: ${socket.id}`);
        });

        // 客户端发送 offer
        socket.on(SocketEvents.WebRTCOffer, (data: { targetId: string, offer: RTCSessionDescriptionInit }) => {
            const { targetId, offer } = data;
            if (userService.getUser(targetId)) {
                socket.to(targetId).emit(SocketEvents.WebRTCOffer, {
                    sourceId: socket.id,
                    offer
                });
                logger.debug(`WebRTC offer sent from ${socket.id} to ${targetId}`);
            } else {
                logger.warn(`Failed to send offer: Target user ${targetId} not found`);
            }
        });

        // 客户端发送 answer
        socket.on(SocketEvents.WebRTCAnswer, (data: { targetId: string, answer: RTCSessionDescriptionInit }) => {
            const { targetId, answer } = data;
            if (userService.getUser(targetId)) {
                socket.to(targetId).emit(SocketEvents.WebRTCAnswer, {
                    sourceId: socket.id,
                    answer
                });
                logger.debug(`WebRTC answer sent from ${socket.id} to ${targetId}`);
            } else {
                logger.warn(`Failed to send answer: Target user ${targetId} not found`);
            }
        });

        // 客户端 ICE 候选者
        socket.on(SocketEvents.WebRTCICECandidate, (data: { targetId: string, candidate: RTCIceCandidate }) => {
            const { targetId, candidate } = data;
            if (userService.getUser(targetId)) {
                socket.to(targetId).emit(SocketEvents.WebRTCICECandidate, {
                    sourceId: socket.id,
                    candidate
                });
                logger.debug(`WebRTC ICE candidate sent from ${socket.id} to ${targetId}`);
            } else {
                logger.warn(`Failed to send ICE candidate: Target user ${targetId} not found`);
            }
        });
    });
}; 