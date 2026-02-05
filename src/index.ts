import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/initdb';
import authRoutes from './auth/auth';
import customerRoutes from './customers/customers';
import userRoutes from './users/users';
import authenticate from './middlewares/authenticate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for local development
const corsOptions = {
  origin: [
    'http://localhost:3000',  // React default
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4000',  // Vue default
    'http://localhost:4001',
    'http://localhost:4002',
    'http://localhost:8080',  // Vue CLI default
    'http://localhost:8081',
    'http://localhost:8082',
    'http://127.0.0.1:3000', // Alternative localhost
    'http://127.0.0.1:4000',
    'http://127.0.0.1:8080',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/users', authenticate, userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Login API: POST http://localhost:${PORT}/api/auth/login`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
