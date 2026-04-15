import mongoose from "mongoose";
import dotenv from "dotenv";
import Crime from "./backend/Models/Crime.js";

dotenv.config({ path: "./backend/.env" });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    const count = await Crime.countDocuments();
    console.log(`Total Crimes in 'Crimes' collection: ${count}`);
    
    const recent = await Crime.find().limit(5);
    console.log("Recent 5 crimes:", JSON.stringify(recent, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkData();
