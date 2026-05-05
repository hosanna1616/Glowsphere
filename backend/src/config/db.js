const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || "mongodb://localhost:27017/glowsphere";
  const fallbackUri = process.env.MONGODB_URI_FALLBACK || "";

  const connectWithUri = async (uri) =>
    mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for Atlas
      socketTimeoutMS: 45000,
    });

  try {
    console.log("🔄 Connecting to MongoDB...");

    const conn = await connectWithUri(primaryUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn; // Return connection for verification
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    const canFallback =
      Boolean(fallbackUri) &&
      fallbackUri !== primaryUri &&
      (error.message.includes("querySrv") ||
        error.message.toLowerCase().includes("authentication failed") ||
        error.message.toLowerCase().includes("bad auth"));

    if (!canFallback) {
      throw error; // Throw error so caller can handle it
    }

    console.log("⚠️ Primary MongoDB failed, trying fallback connection...");
    const conn = await connectWithUri(fallbackUri);
    console.log(`✅ MongoDB Connected (fallback): ${conn.connection.host}`);
    return conn;
  }
};

module.exports = connectDB;
