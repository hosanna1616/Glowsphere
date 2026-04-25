const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/glowsphere";
    
    console.log("🔄 Connecting to MongoDB...");
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for Atlas
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn; // Return connection for verification
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error; // Throw error so caller can handle it
  }
};

module.exports = connectDB;
