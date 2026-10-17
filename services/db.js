const mongoose = require('mongoose');

let isConnected = false;
let memoryStore = new Map(); // Resilient fallback if MongoDB is not reachable immediately

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️  MONGODB_URI not provided. Running in resilient in-memory mode.');
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
    console.warn('⚡ GlowSlides will automatically use in-memory store so the app remains fully functional.');
    isConnected = false;
    return false;
  }
};

const getDBStatus = () => ({
  connected: isConnected && mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || 'In-Memory Cache (Fallback)',
  usingAtlas: (process.env.MONGODB_URI || '').includes('mongodb+srv://')
});

module.exports = {
  connectDB,
  getDBStatus,
  memoryStore,
  get isConnected() {
    return isConnected && mongoose.connection.readyState === 1;
  }
};
