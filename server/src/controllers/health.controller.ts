import { Request, Response } from 'express';
import { Services } from '../services';
import os from 'os';

export class HealthController {
    constructor(private services: Services) { }

    // 基本健康检查
    check = (req: Request, res: Response) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    };

    // 详细系统状态
    status = (req: Request, res: Response) => {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        res.json({
            status: 'ok',
            uptime: uptime,
            uptimeFormatted: this.formatUptime(uptime),
            timestamp: new Date().toISOString(),
            memory: {
                rss: this.formatBytes(memoryUsage.rss),
                heapTotal: this.formatBytes(memoryUsage.heapTotal),
                heapUsed: this.formatBytes(memoryUsage.heapUsed),
                external: this.formatBytes(memoryUsage.external)
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0].model,
                loadAvg: os.loadavg()
            },
            platform: {
                type: os.type(),
                release: os.release(),
                arch: os.arch()
            }
        });
    };

    // 用户统计
    userStats = (req: Request, res: Response) => {
        const onlineUsers = this.services.userService.getOnlineUsers();
        const onlineCount = this.services.userService.getOnlineCount();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            stats: {
                onlineCount,
                users: onlineUsers.map(user => ({
                    id: user.socketId,
                    name: user.name,
                    joinedAt: user.joinedAt
                }))
            }
        });
    };

    // 格式化运行时间
    private formatUptime = (uptime: number) => {
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    // 格式化字节数
    private formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
} 