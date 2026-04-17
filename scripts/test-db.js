import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('Connecting to:', mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@'));

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connection successful!');

    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.collections();
    console.log('Available collections:', collections.map(c => c.collectionName));

    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully!');

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();