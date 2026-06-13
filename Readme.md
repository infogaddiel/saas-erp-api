# Gaddiel ERP API

A TypeScript-based ERP API with PostgreSQL database and user authentication.

## Features

- TypeScript support
- Express.js server
- PostgreSQL database with users and company tables
- Login API with mobile number and password
- Password hashing with bcrypt
- Database initialization on startup

## Project Structure

```
src/
├── config/
│   ├── database.ts       # Database connection configuration
│   └── initdb.ts         # Database schema initialization
├── routes/
│   └── auth.ts           # Authentication routes
├── services/
│   └── authService.ts    # Authentication business logic
└── index.ts              # Main server entry point
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your PostgreSQL credentials:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/gaddiel_erp
NODE_ENV=development
PORT=5000
```

### 3. Build the Project

```bash
npm run build
```

This compiles TypeScript files to the `dist` folder.

### 4. Start the Server

#### Development (with ts-node):
```bash
npm run dev
```

#### Production (compiled version):
```bash
npm start
```

The server will:
- Initialize the database (create tables if they don't exist)
- Start listening on the configured PORT (default: 5000)
- Available at `http://localhost:5000`

## Database Schema

### Company Table
```sql
CREATE TABLE company (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contract TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  profile_image VARCHAR(255),
  mobile VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  company_id INTEGER REFERENCES company(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "API is running"
}
```

### Login API
```
POST /api/auth/login
Content-Type: application/json

{
  "mobile": "1234567890",
  "password": "user_password"
}
```

Success Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "profile_image": null,
    "company_id": 1
  }
}
```

Error Response (401):
```json
{
  "success": false,
  "message": "Invalid password"
}
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled production build
- `npm run dev` - Run in development mode with ts-node
- `npm test` - Run tests (placeholder)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Bcrypt** - Password hashing
- **dotenv** - Environment variable management

## Notes

- Passwords are automatically hashed using bcrypt before storage
- Mobile numbers are unique and required for login
- Company table is referenced by users with foreign key
- Database is automatically initialized on server startup
