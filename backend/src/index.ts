import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { connectToDatabase } from './database/connection';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

const frontendDistPath = path.resolve(__dirname, '../public');
const hasFrontendBuild = fs.existsSync(frontendDistPath);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }

    const indexFilePath = path.join(frontendDistPath, 'index.html');
    if (!fs.existsSync(indexFilePath)) {
      res.status(500).send('Frontend build not found');
      return;
    }

    res.sendFile(indexFilePath);
  });
} else {
  console.warn('⚠️  Frontend build not found. Run `npm run build:frontend` from the backend to generate the production assets.');
}

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

