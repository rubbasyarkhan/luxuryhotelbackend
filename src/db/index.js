import mongoose from "mongoose";

export default async function connectDb() {
  try {
    const uri = process.env.MONGODB_URI; 
    await mongoose.connect(`${uri}`);  
    console.log("Db connected successfully");
  } catch (error) {
    console.log("Failed to connect db", error);
  }
}