import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas using Mongoose.
 * Exits process with failure code if connection cannot be established.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    await mongoose.connect(mongoUri, {
      autoSelectFamily: false,
      family: 4,
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
