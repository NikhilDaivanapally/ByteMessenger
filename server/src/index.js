import dotenv from "dotenv";
// import { app } from "./app.js";
import { server } from "./socket.js";
import {connectToMongodb} from "./db/connectToMongodb.js";

dotenv.config({
  path: "./env",
});

connectToMongodb()
  .then(() => {
    server.listen(process.env.PORT || 8000, () => {
      console.log(`server is Running on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });
