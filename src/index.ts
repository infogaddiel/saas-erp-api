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
    'http://localhost:8100',  // React default
    'capacitor://localhost', 
    'http://localhost'
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
