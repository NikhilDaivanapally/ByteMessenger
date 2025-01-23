import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import { gridFSBucket } from "./db/connectToMongodb.js";
import passport from "./utils/passport.strategies.js";
import session from "express-session";
import { RedisStore } from "connect-redis";
// import redis from "./db/redis.js";
const app = express();

app.use(
  cors({
    origin: ["https://byte-messenger.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    store: new RedisStore({ client: redis, ttl: 24 * 60 * 60 }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production
      domain: "https://byte-messenger.vercel.app",
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

import { ObjectId } from "mongodb";
import redis from "./db/redis.js";

app.get("/audio/:id", (req, res) => {
  const fileId = req.params.id;
  console.log("Received fileId:", fileId);

  try {
    // Convert string ID to ObjectId
    const objectId = new ObjectId(fileId);
    const downloadStream = gridFSBucket.openDownloadStream(objectId);

    res.set("Content-Type", "audio/webm"); // Adjust MIME type if necessary
    console.log("Download stream found");
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("Error in download stream:", err.message);
      res.status(404).send({ error: "Audio not found", details: err.message });
    });

    res.on("finish", () => {
      console.log("Audio served successfully.");
    });
  } catch (err) {
    console.error("Error handling request:", err.message);
    res.status(400).send({ error: "Invalid audio ID", details: err.message });
  }
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Your backend is working fine👍🏼",
  });
});

export { app };
