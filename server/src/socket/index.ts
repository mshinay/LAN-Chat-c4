import { Server, Socket } from 'socket.io';
import { User } from '../types/user';
import { SocketEvents } from '../types/socket';
import { Services } from '../services';
import { logger } from '../utils/logger';

export const setupSocketIO = (io: Server, services: Services) => {
    const { userService } = services;

    logger.info('Setting up Socket.IO server');

    // 用户加入连接
    io.on(SocketEvents.Connection, (socket: Socket) => {
        logger.debug(`New connection: ${socket.id}`);

        // 客户端立即发送用户加入连接
        socket.on(SocketEvents.UserJoin, (user: User) => {
            userService.addUser(socket.id, user);
            // 通知全部客户端更新在线列表
            io.emit(SocketEvents.UsersUpdate, userService.getOnlineUsers());
            logger.info(`User joined: ${user.name} (${socket.id})`);
        });

        // 客户端断开连接
        socket.on(SocketEvents.Disconnect, () => {
            userService.removeUser(socket.id);
            io.emit(SocketEvents.UsersUpdate, userService.getOnlineUsers());
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