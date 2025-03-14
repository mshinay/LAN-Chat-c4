import { Server } from 'socket.io';
import { UserService } from './user.service';

export class ChatService {
    private io: Server | null = null;
    private userService: UserService | null = null;

    constructor() {
        // 不再直接实例化UserService
    }

    setSocketServer(io: Server) {
        this.io = io;
    }

    setUserService(userService: UserService) {
        this.userService = userService;
    }

    async handleSignal(from: string, to: string, signal: any) {
        if (!this.io) {
            throw new Error('Socket server not initialized');
        }

        if (!this.userService) {
            throw new Error('User service not initialized');
        }

        const toUser = this.userService.getUser(to);
        if (!toUser) {
            throw new Error('User not found');
        }

        // Emit the signal to the target user
        this.io.to(toUser.socketId).emit('webrtc:signal', {
            from,
            signal
        });
    }
} 