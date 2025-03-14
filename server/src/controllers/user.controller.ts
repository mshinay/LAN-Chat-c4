import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    constructor(private userService: UserService) { }

    getOnlineUsers = (req: Request, res: Response) => {
        try {
            const users = this.userService.getOnlineUsers();
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get online users',
                error: (error as Error).message
            });
        }
    };
} 