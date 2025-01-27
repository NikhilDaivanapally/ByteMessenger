import mongoose from "mongoose";
import Friendship from "../models/friendship.model.js";
import { Message } from "../models/message.model.js";
import OneToManyMessage from "../models/oneToManyMessage.model.js";
import OneToOneMessage from "../models/oneToOneMessage.model.js";
import User from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { filterObj } from "../utils/filterObj.js";

const updateProfile = async (req, res, next) => {
  const filteredBody = filterObj(req.body, "userName", "about", "email");
  const avatarLocalpath = req.file?.path;
  let avatar;
  if (avatarLocalpath) {
    avatar = await uploadCloudinary(avatarLocalpath);
  }

  if (avatar?.secure_url) {
    filteredBody.avatar = avatar.secure_url;
  }
  const userDoc = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    validateModifiedOnly: true,
  });

  res.status(200).json({
    status: "success",
    data: userDoc,
    message: "User Updated successfully",
  });
};

const getUsers = async (req, res, next) => {
  const currentUserId = req.user._id;
  const all_users = await User.find({ verified: true }).select(
    "_id userName avatar about socket_id"
  );
  // Fetch friendships where the current user is either sender or recipient
  const currentuser_friends = await Friendship.find({
    $or: [{ sender: currentUserId }, { recipient: currentUserId }],
  });

  // Extract IDs that are not the current user's ID
  const friendIds = currentuser_friends.map((friendship) => {
    return String(friendship.sender) === String(currentUserId)
      ? friendship.recipient.toString()
      : friendship.sender.toString();
  });
  const remaining_users = all_users.filter((user) => {
    return (
      !friendIds.includes(user._id.toString()) &&
      user._id.toString() !== currentUserId.toString()
    );
  });
  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
};

const getFriends = async (req, res, next) => {
  const pipeline = [
    // Match documents where the sender or recipient matches the provided ID
    {
      $match: {
        $and: [
          {
            $or: [{ sender: req.user._id }, { recipient: req.user._id }],
          },
          { status: "accepted" },
        ],
      },
    },
    // Determine the other party (the sender or recipient that is NOT the provided ID)
    {
      $project: {
        otherParty: {
          $cond: {
            if: { $eq: ["$sender", req.user._id] },
            then: "$recipient",
            else: "$sender",
          },
        },
      },
    },
    // Lookup to fetch the details of the other party from the 'users' collection
    {
      $lookup: {
        from: "users", // The collection containing user data
        localField: "otherParty", // Field in the current collection
        foreignField: "_id", // Field in the 'users' collection
        as: "userDetails", // Output field containing matched user documents
        pipeline: [
          // Exclude fields here using $project
          {
            $project: {
              password: 0, // Exclude fields
              confirmPassword: 0,
              verified: 0,
              friends: 0,
              otp_expiry_time: 0,
              otp: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    // Unwind the userDetails array
    {
      $unwind: "$userDetails",
    },
    // Group all userDetails into a single array
    {
      $group: {
        _id: null, // Group all documents together
        users: { $addToSet: "$userDetails" }, // Combine all userDetails into a single array
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ];
  const Userfriends = await Friendship.aggregate(pipeline);
  res.status(200).json({
    status: "success",
    data: Userfriends[0]?.users,
    message: "friends found successfully",
  });
};

const getFriendrequest = async (req, res, next) => {
  const requests = await Friendship.find({
    $or: [
      {
        recipient: req.user._id,
      },
      {
        sender: req.user._id,
      },
    ],
    status: "pending",
  })
    .select("_id sender recipient")
    .populate({
      path: "sender recipient",
      select: "_id userName avatar status",
    });
  // console.log(requests);
  res.status(200).json({
    status: "success",
    data: requests,
    message: "friend requests found successfully",
  });
};

const getDirectConversations = async (req, res, next) => {
  try {
    const Existing_Direct_Conversations = await OneToOneMessage.aggregate([
      {
        $match: {
          participants: {
            $in: [req.user._id],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $match: {
                _id: { $ne: req.user._id }, // Exclude the current user from the participants
              },
            },
            {
              $project: {
                password: 0, // Exclude sensitive fields
                confirmPassword: 0,
                verified: 0,
                friends: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: "$user", // Unwind since we expect only one user in the array
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "conversationId",
          as: "messages",
        },
      },
      {
        $project: {
          _id: 1,
          messages: 1, // Include messages
          user: 1, // The user field will now contain the desired user object
        },
      },
    ]);

    return res.status(200).json({
      status: "success",
      data: Existing_Direct_Conversations,
      message: "Existing DirectConversations found successfully",
    });
  } catch (error) {
    return res.status(400).json({
      status: "Error",
      data: null,
      message: "Error while fetching the DirectConversations",
    });
  }
};

const getGroupConversations = async (req, res, next) => {
  try {
    const Existing_Group_Conversations = await OneToManyMessage.aggregate([
      {
        $match: {
          $or: [
            { participants: { $all: [req.user._id] } },
            { admin: req.user._id },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "admin",
          foreignField: "_id",
          as: "admin",
          pipeline: [
            {
              $project: {
                password: 0, // Exclude fields
                confirmPassword: 0,
                verified: 0,
                friends: 0,
                otp_expiry_time: 0,
                otp: 0,
                __v: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$admin",
          preserveNullAndEmptyArrays: true, // Optional: Keep documents without matching admins
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants",
          pipeline: [
            {
              $project: {
                password: 0, // Exclude fields
                confirmPassword: 0,
                verified: 0,
                friends: 0,
                otp_expiry_time: 0,
                otp: 0,
                __v: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "conversationId",
          as: "messages",
        },
      },
    ]);

    return res.status(200).json({
      status: "success",
      data: Existing_Group_Conversations,
      message: "Existing GroupConversations found successfully",
    });
  } catch (err) {
    // Handle error appropriately
    return res.status(400).json({
      status: "Error",
      data: null,
      message: "Error while fetching the GroupConversations",
    });
  }
};

const getConversation = async (req, res, next) => {
  const { conversationId, conversationType } = req.body;
  let conversation;
  switch (conversationType) {
    case "OneToOneMessage":
      conversation = await OneToOneMessage.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(conversationId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $match: {
                  _id: { $ne: req.user._id }, // Exclude the current user from the participants
                },
              },
              {
                $project: {
                  password: 0, // Exclude sensitive fields
                  confirmPassword: 0,
                  verified: 0,
                  friends: 0,
                },
              },
            ],
          },
        },
        {
          $unwind: "$user", // Unwind since we expect only one user in the array
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "conversationId",
            as: "messages",
          },
        },
        {
          $project: {
            _id: 1,
            messages: 1, // Include messages
            user: 1, // The user field will now contain the desired user object
          },
        },
      ]);
      break;
    case "OneToManyMessage":
      conversation = await OneToManyMessage.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(conversationId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "admin",
            foreignField: "_id",
            as: "admin",
            pipeline: [
              {
                $project: {
                  password: 0, // Exclude fields
                  confirmPassword: 0,
                  verified: 0,
                  friends: 0,
                  otp_expiry_time: 0,
                  otp: 0,
                  __v: 0,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$admin",
            preserveNullAndEmptyArrays: true, // Optional: Keep documents without matching admins
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participants",
            pipeline: [
              {
                $project: {
                  password: 0, // Exclude fields
                  confirmPassword: 0,
                  verified: 0,
                  friends: 0,
                  otp_expiry_time: 0,
                  otp: 0,
                  __v: 0,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "conversationId",
            as: "messages",
          },
        },
        {
          $project: {
            _id: 1,
            messages: 1, // Include messages
            participants: 1, // The user field will now contain the desired user object
            admin: 1,
          },
        },
      ]);
    default:
      break;
  }
  // console.log(conversation);

  const hasMessages = conversation[0]?.messages?.length > 0;
  if (hasMessages) {
    return res.status(200).json({
      status: "success",
      data: conversation[0],
      message: "Conversation found successfully",
    });
  }
  return res.status(200).json({
    status: "success",
    data: null,
    message: "Conversation Notfound due to no Messages successfully",
  });
};

const createGroup = async (req, res, next) => {
  const { title, users, admin } = req.body;
  const avatarLocalpath = req.file?.path;
  let avatar;
  if (avatarLocalpath) {
    avatar = await uploadCloudinary(avatarLocalpath);
  }

  let group_created = await OneToManyMessage.create({
    title,
    participants: JSON.parse(users),
    admin,
    avatar: avatar?.secure_url || "",
  });

  group_created = await OneToManyMessage.findById(group_created._id)
    .populate(["admin", "participants"])
    .lean(); // Converts the result to a plain JS object

  group_created["messages"] = []; // Now you can add new fields safely

  return res.status(200).json({
    status: "success",
    data: group_created,
    message: "group_created successfully",
  });
};

const messagepost = async (req, res) => {
  const data = req.body;
  console.log(data);
  const createmsg = await Message.create(data);
  res.json({ status: 200, data: createmsg });
};

export {
  updateProfile,
  getUsers,
  getFriends,
  getFriendrequest,
  getDirectConversations,
  getGroupConversations,
  getConversation,
  createGroup,
  messagepost,
};
