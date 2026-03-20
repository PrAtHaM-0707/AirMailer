import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import emailRoutes from './routes/email';
import keysRoutes from './routes/keys';
import logsRoutes from './routes/logs';
import testDbRoutes from './routes/test-db';

dotenv.config();

const app = express();

app.use(helmet());

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use(limiter);

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/keys', keysRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api', testDbRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'API is healthy and running', timestamp: new Date().toISOString() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  logger.error('Unhandled server error', { error: err.stack });
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});