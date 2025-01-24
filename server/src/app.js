import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import { gridFSBucket } from "./db/connectToMongodb.js";
import passport from "./utils/passport.strategies.js";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { ObjectId } from "mongodb";
import redis from "./db/redis.js";

const app = express();

// Configure CORS
app.use(
  cors({
    origin: "https://byte-messenger.vercel.app", // Frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true, // Allow cookies and Authorization headers
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure session with Redis store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    store: new RedisStore({ client: redis, ttl: 24 * 60 * 60 }), // TTL = 1 day
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      sameSite: "none", // Required for cross-origin cookies
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    },
  })
);

// Configure Passport.js
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate("session"));

// Trust proxy for secure cookies in production
app.set("trust proxy", 1); // `1` for one level of proxy (e.g., Vercel)

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

// API routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);

// Default route
app.use("/", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Your backend is working fine 👍🏼",
  });
});

export { app };
