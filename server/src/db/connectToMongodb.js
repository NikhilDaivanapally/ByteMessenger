import mongoose from "mongoose";

console.log(process.env.MONGO_DB_URL);

// GridFS Bucket variable
let gridFSBucket;

const connectToMongodb = async () => {
  try {
    const connection = await mongoose.connect(
      `${process.env.MONGO_DB_URL}`
    );

    console.log(
      `\n MongoDB connected !! DB HOST : ${connection.connection.host}`
    );

    // Initialize GridFSBucket after MongoDB connection is established
    const db = connection.connection.db;
    gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads", // You can change the bucket name as needed
    });

    console.log("GridFS Bucket initialized with name:", "uploads");
  } catch (error) {
    console.log("MONGODB Connection error", error);
    process.exit(1); // Terminate the Node process due to connection failure
  }
};

export { connectToMongodb, gridFSBucket };
