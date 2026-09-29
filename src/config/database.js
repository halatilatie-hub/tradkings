const mongoose = require('mongoose');
const { mongoUri } = require('./index');

let isConnected = false;

async function connectMongo() {
  if (!mongoUri || process.env.MONGO_DISABLED === 'true') {
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(mongoUri, { autoIndex: true });
    isConnected = true;
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.warn('MongoDB connection failed. Continuing without a live database:', error.message);
    return false;
  }
}

module.exports = { connectMongo };
