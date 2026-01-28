import mongoose from "mongoose";


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI,{ dbName: "attendance" });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error", err);
    process.exit(1);
  }
};

export default connectDB;
