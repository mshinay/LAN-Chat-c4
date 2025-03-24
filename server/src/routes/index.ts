import { Express } from 'express';
import { Services } from '../services';
import apiRoutes from './api';


export const setupRoutes = (app: Express, services: Services) => {
    // API 路由
    app.use('/api', apiRoutes(services));
}; 