import mongoose from "mongoose";

// GridFS Bucket variable
let gridFSBucket;

const connectToMongodb = async () => {
  try {
    const connection = await mongoose.connect(`${process.env.MONGO_DB_URL}`);
    // Initialize GridFSBucket after MongoDB connection is established
    const db = connection.connection.db;
    gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads", // You can change the bucket name as needed
    });
  } catch (error) {
    process.exit(1); // Terminate the Node process due to connection failure
  }
};

export { connectToMongodb, gridFSBucket };
