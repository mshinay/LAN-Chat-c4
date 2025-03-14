import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

export class ChatController {
    constructor(private chatService: ChatService) { }

    handleSignal = async (req: Request, res: Response) => {
        try {
            const { from, to, signal } = req.body;

            if (!from || !to || !signal) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            await this.chatService.handleSignal(from, to, signal);

            res.json({
                success: true,
                message: 'Signal sent successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to handle signal',
                error: (error as Error).message
            });
        }
    };

    getStatus = (req: Request, res: Response) => {
        try {
            res.json({
                success: true,
                status: 'online',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get status',
                error: (error as Error).message
            });
        }
    };
} 