import { User } from '../types/user'
import { logger } from '../utils/logger'

export class UserService {
    private onlineUsers: Map<string, User>;
    private userActivity: Map<string, Date>; // 跟踪用户最后活动时间

    constructor() {
        this.onlineUsers = new Map();
        this.userActivity = new Map();

        // 设置定期清理不活跃用户的任务
        setInterval(() => this.cleanupInactiveUsers(), 60000); // 每分钟检查一次
    }

    /**
     * 添加用户到在线列表
     */
    addUser(socketId: string, user: User): User {
        // 确保用户有必要的字段
        const newUser: User = {
            socketId,
            name: user.name || 'Anonymous',
            joinedAt: user.joinedAt || new Date().toISOString()
        };

        this.onlineUsers.set(socketId, newUser);
        this.updateUserActivity(socketId);

        logger.info(`User added: ${newUser.name} (${socketId})`);
        return newUser;
    }

    /**
     * 从在线列表中移除用户
     */
    removeUser(userId: string): boolean {
        const user = this.onlineUsers.get(userId);
        const result = this.onlineUsers.delete(userId);
        this.userActivity.delete(userId);

        if (user) {
            logger.info(`User removed: ${user.name} (${userId})`);
        }

        return result;
    }

    /**
     * 获取特定用户
     */
    getUser(userId: string): User | undefined {
        const user = this.onlineUsers.get(userId);
        if (user) {
            this.updateUserActivity(userId);
        }
        return user;
    }

    /**
     * 获取所有在线用户
     */
    getOnlineUsers(): User[] {
        return Array.from(this.onlineUsers.values());
    }

    /**
     * 获取在线用户数量
     */
    getOnlineCount(): number {
        return this.onlineUsers.size;
    }

    /**
     * 更新用户活动时间
     */
    updateUserActivity(userId: string): void {
        this.userActivity.set(userId, new Date());
    }

    /**
     * 清理长时间不活跃的用户
     */
    private cleanupInactiveUsers(): void {
        const now = new Date();
        const inactiveThreshold = 30 * 60 * 1000; // 30分钟不活跃视为离线

        this.userActivity.forEach((lastActivity, userId) => {
            const timeSinceLastActivity = now.getTime() - lastActivity.getTime();

            if (timeSinceLastActivity > inactiveThreshold) {
                logger.warn(`Removing inactive user: ${userId}, inactive for ${Math.round(timeSinceLastActivity / 60000)} minutes`);
                this.removeUser(userId);
            }
        });
    }
} 