import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/initdb';
import authRoutes from './auth/auth';
import customerRoutes from './customers/customers';
import userRoutes from './users/users';
import itemRoutes from './items/items';
import ticketRoutes from './tickets/tickets';
import authenticate from './middlewares/authenticate';
import uploadRoutes from './uploads/uploads';
import companyRoutes from './companies/companies';
import contractRoutes from './contracts/contracts';
import projectRoutes from './projects/projects';
import leadRoutes from './leads/leads';
import vendorRoutes from './vendors/vendors';
import purchaseOrderRoutes from './purchaseOrders/purchaseOrders';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './swagger/openapi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for local development
const corsOptions = {
  origin: [
    'http://localhost:3000',  // React default
    'http://localhost:8100',  // React default
    'capacitor://localhost', 
    'http://localhost',
    'https://semak-erp.gaddiel.io',
    'http://semak-erp.gaddiel.io'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.enable('trust proxy');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
app.get('/api-docs.json', (_req, res) => {
  res.json(openApiSpec);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    explorer: true,
    customSiteTitle: 'Gaddiel ERP API Docs',
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/companies', authenticate, companyRoutes);
app.use('/api/items', authenticate, itemRoutes);
app.use('/api/tickets', authenticate, ticketRoutes);
app.use('/api/contracts', authenticate, contractRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/leads', authenticate, leadRoutes);
app.use('/api/vendors', authenticate, vendorRoutes);
app.use('/api/purchase-orders', authenticate, purchaseOrderRoutes);
app.use('/api/uploads', uploadRoutes);

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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
