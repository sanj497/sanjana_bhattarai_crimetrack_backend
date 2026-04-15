import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const url = process.env.MONGODB_URL || process.env.MONGO_URL;
    if (!url) {
       console.error("CRITICAL ERROR: MONGODB_URL is missing in environment variables.");
       process.exit(1);
    }
    await mongoose.connect(url);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
