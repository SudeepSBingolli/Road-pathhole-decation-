const http = require('http');
const dotenv = require('dotenv');

// Load environment variables before any local module imports
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { initOverdueCron } = require('./cron/overdueCron');

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start Server after connecting to MongoDB
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start Scheduled Background Cron Jobs
    initOverdueCron();

    // 3. Listen on Port
    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(` RoadWatch Backend running in [${process.env.NODE_ENV || 'development'}] mode`);
      console.log(` Server listening on: http://localhost:${PORT}`);
      console.log(` WebSocket server enabled for realtime alerts`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error(`[Server Startup Error]: ${err.message}`);
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = (signal) => {
  console.log(`\n[${signal}] Received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP and Socket server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();

