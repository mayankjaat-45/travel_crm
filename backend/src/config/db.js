import mongoose from "mongoose";

let isConnected = false;

const connectDb = async () => {
  if (isConnected) {
    console.log("MongoDb already Connected");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    isConnected: true;

    console.log(`Mongodb Connected : ${conn.connection.name}`);
  } catch (error) {
    console.log(`Mongodb Connected Failed, ${error.message}`);
    process.exit(1);
  }
};

export default connectDb;
