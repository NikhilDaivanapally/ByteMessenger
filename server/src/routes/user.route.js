import { Router } from "express";
import { upload } from "../middelwares/multer.middleware.js";
import {
  createGroup,
  getConversation,
  getDirectConversations,
  getFriendrequest,
  getFriends,
  getGroupConversations,
  getUsers,
  messagepost,
  updateProfile,
} from "../controllers/user.controller.js";
import { ensureAuthenticated } from "../middelwares/auth.middleware.js";
import Friendship from "../models/friendship.model.js";

const router = Router();

router.patch(
  "/update-profile",
  ensureAuthenticated,
  upload.single("avatar"),
  updateProfile
);
router.get("/get_users", ensureAuthenticated, getUsers);
router.get("/get_friends", ensureAuthenticated, getFriends);
router.get("/get_friend_request", ensureAuthenticated, getFriendrequest);
router.get(
  "/get_direct_conversations",
  ensureAuthenticated,
  getDirectConversations
);
router.get(
  "/get_group_conversations",
  ensureAuthenticated,
  getGroupConversations
);

router.post("/get_conversation", ensureAuthenticated, getConversation);
router.post(
  "/create_group",
  ensureAuthenticated,
  upload.single("avatar"),
  createGroup
);

router.post("/message", messagepost);
router.post("/addrequest", async (req, res) => {
  const { sender, recipient } = req.body;
  const data = await Friendship.create({
    sender,
    recipient,
  });
  res.json({ status: "success", data: data });
});

export default router;
