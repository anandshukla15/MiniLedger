import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'miniledger_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'pass',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'miniledger_super_secure_jwt_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  uploadDir: path.resolve(__dirname, '../../uploads'),
};
