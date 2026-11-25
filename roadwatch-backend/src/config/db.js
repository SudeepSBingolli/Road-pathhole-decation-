const mongoose = require('mongoose');

/**
 * Connect to MongoDB with automatic in-memory fallback if local/remote MongoDB is offline
 */
const connectDB = async () => {
  const targetUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roadwatch';

  try {
    // 1. Attempt connection to configured URI (with a fast 2.5s timeout)
    const conn = await mongoose.connect(targetUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 2500
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (initialErr) {
    console.warn(`[MongoDB] Primary connection to '${targetUri}' failed (${initialErr.message}).`);
    console.log('[MongoDB] Initializing embedded in-memory MongoDB server for development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();

      console.log(`[MongoDB] In-memory database running at: ${memoryUri}`);
      const conn = await mongoose.connect(memoryUri, { autoIndex: true });

      // Automatically seed the in-memory database with test accounts & reports
      console.log('[MongoDB] Auto-seeding initial RoadWatch dataset into in-memory store...');
      const { seedDatabase } = require('../../scripts/seed');
      await seedDatabase(false);

      return conn;
    } catch (memErr) {
      console.error(`[MongoDB] In-memory fallback failed: ${memErr.message}`);
      console.error('[MongoDB] Please ensure MongoDB is running or provide a valid MONGODB_URI.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
