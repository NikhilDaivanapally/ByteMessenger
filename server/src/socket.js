import { Server } from "socket.io";
import http from "http";
import { app } from "./app.js";
import User from "./models/user.model.js";
import OneToOneMessage from "./models/oneToOneMessage.model.js";
import { v2 as cloudinary, v2 } from "cloudinary";
import { gridFSBucket } from "./db/connectToMongodb.js";
import { Readable } from "stream";
import streamifier from "streamifier";
import redis from "./db/redis.js";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { Message } from "./models/message.model.js";
import Friendship from "./models/friendship.model.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://byte-messenger.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
  // adapter: createAdapter(redis),
});

io.on("connection", async (socket) => {
  const user_id = socket.handshake.query["auth_id"];
  // const socket_id = socket.id;
  if (user_id !== null && Boolean(user_id)) {
    try {
      const user = await User.findByIdAndUpdate(
        user_id, // user id
        {
          socket_id: socket.id, // update
          status: "Online",
        },
        { new: true } // return updated doc
      );

      const friends = await OneToOneMessage.aggregate([
        {
          $match: {
            participants: {
              $in: [user?._id],
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
                  _id: { $ne: user?._id }, // Exclude the current user from the participants
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
          $project: {
            _id: 0,
            user: 1,
          },
        },
      ]);
      const socket_ids = friends?.map(async (friend) => {
        return friend?.user?.socket_id;
      });

      const EmmitStatusTo = await Promise.all(socket_ids);

      EmmitStatusTo.forEach((socketId) => {
        if (socketId) {
          const socketExists = io.sockets.sockets.get(socketId);
          if (socketExists) {
            io.to(socketId).emit("user_status_update", {
              id: user_id,
              status: "Online",
            });
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  // socket event listeners

  // (Requests)
  socket.on("friend_request", async (data) => {
    const { sender, recipient } = data;
    // sender
    const from = await User.findById(sender).select("socket_id");
    // recipient
    const to = await User.findById(recipient).select("socket_id");

    await Friendship.create({
      sender: sender,
      recipient: recipient,
    });

    io.to(to?.socket_id).emit("new_friendrequest", {
      message: "New friend request received",
    });
    io.to(from?.socket_id).emit("friendrequest_sent", {
      message: "Request Sent successfully",
    });
  });

  socket.on("accept_friendrequest", async (data) => {
    const request_doc = await Friendship.findById(data.request_id);
    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.recipient);

    // update the status to accepted
    request_doc.status = "accepted";
    await request_doc.save({ new: true, validateModifiedOnly: true });

    // emit event to both of them
    io.to(sender?.socket_id).emit("friendrequest_accepted", {
      message: `${receiver.userName} Accepted your Friend Request`,
    });
    io.to(receiver?.socket_id).emit("friendrequest_accepted", {
      message: `You Accepted ${sender.userName} Friend Request`,
    });
  });

  socket.on("start_conversation", async (data) => {
    const { to, from } = data;
    const existing_conversations = await OneToOneMessage.find({
      participants: { $all: [to, from] },
    })
      .populate("participants")
      .select("userName avatar _id email status");
    if (existing_conversations.length === 0) {
      let new_chat = await OneToOneMessage.create({
        participants: [to, from],
      });
      new_chat = await OneToOneMessage.findById(new_chat._id)
        .populate("participants")
        .select("userName avatar _id email status");
      socket.emit("start_chat", new_chat);
    } else {
      socket.emit("start_chat", existing_conversations[0]);
    }
  });

  socket.on("group_created", async (data) => {
    const { participants, admin } = data;
    const socket_ids = participants.map((el) => el?.socket_id);
    io.to(admin?.socket_id).emit("new_groupChat_admin", data);
    socket_ids.forEach((socketId) => {
      if (socketId) {
        io.to(socketId).emit("new_groupChat", data);
      } else {
        console.error("Encountered a null or undefined socket ID.");
      }
    });
  });

  socket.on("get_messages", async (data, callback) => {
    const messages = await Message.find({
      conversationId: data.conversation_id,
    });
    callback(messages);
  });

  //  (Messages)
  //  text and link msg event
  socket.on("text_message", async (data) => {
    const {
      _id,
      sender,
      recipients,
      messageType,
      message,
      conversationType,
      conversationId,
      createdAt,
      updatedAt,
    } = data;
    switch (conversationType) {
      case "OneToOneMessage":
        const msg_receiver = await User.findById(recipients);
        const msg_sender = await User.findById(sender);
        const _Message = {
          _id,
          sender,
          recipients,
          messageType,
          message,
          conversationType,
          conversationId,
          createdAt,
          updatedAt,
        };
        await Message.create(_Message);
        // emit incoming_message -> to user
        io.to(msg_receiver?.socket_id).emit("new_message", _Message);
        // emit outgoing_message -> from user
        io.to(msg_sender?.socket_id).emit("update_msg_status", {
          messageId: _Message?._id,
          conversationId,
          conversationType,
        });
        break;
      case "OneToManyMessage":
        const from_user_group = await User.findById(sender);
        const _GroupMessage = {
          _id,
          sender,
          recipients,
          messageType,
          message,
          conversationType,
          conversationId,
          createdAt,
          updatedAt,
        };
        await Message.create(_GroupMessage);
        io.to(from_user_group?.socket_id).emit("update_msg_status", {
          messageId: _GroupMessage?._id,
          conversationId,
          conversationType,
        });
        const socket_ids = recipients.map(async (id) => {
          const { socket_id } =
            await User.findById(id).select("socket_id -_id");
          return socket_id;
        });

        Promise.all(socket_ids)
          .then((Sockets) => {
            Sockets.forEach((socketId) => {
              if (socketId) {
                io.to(socketId).emit("new_message", _GroupMessage);
              } else {
                console.error("Encountered a null or undefined socket ID.");
              }
            });
          })
          .catch(() => console.log("error will finding scoket ids"));

        break;
      default:
        break;
    }
  });

  socket.on("msg_seen_byreciever", async (data) => {
    const { messageId, conversationId, conversationType, sender } = data;
    const sender_socket = await User.findById(sender).select("socket_id");
    io.to(sender_socket?.socket_id).emit("update_msg_seen", data);
    await Message.findOneAndUpdate(
      { _id: messageId },
      { $set: { isRead: true } }
    );
  });

  socket.on("audio_message", async (data) => {
    const {
      _id,
      sender,
      recipients,
      messageType,
      message,
      conversationType,
      conversationId,
      createdAt,
      updatedAt,
    } = data;
    // Convert the Blob to a readable stream
    const readableStream = new Readable();
    readableStream.push(Buffer.from(message));
    readableStream.push(null);

    // Upload to GridFS
    const uploadStream = gridFSBucket.openUploadStream(crypto.randomUUID());
    readableStream.pipe(uploadStream);

    uploadStream.on("finish", async () => {
      // console.log("Audio uploaded with ID:", uploadStream.id);
      switch (conversationType) {
        case "OneToOneMessage":
          const msg_receiver = await User.findById(recipients);
          const msg_sender = await User.findById(sender);
          const _Message = {
            _id,
            sender,
            recipients,
            messageType,
            message: {
              audioId: uploadStream.id,
            },
            conversationType,
            conversationId,
            createdAt,
            updatedAt,
          };

          await Message.create(_Message);

          // emit incoming_message -> to user
          io.to(msg_receiver?.socket_id).emit("new_message", _Message);

          // emit outgoing_message -> from user
          io.to(msg_sender?.socket_id).emit("update_msg_status", {
            messageId: _Message?._id,
            conversationId,
            conversationType,
          });
          break;
        case "OneToManyMessage":
          const from_user_group = await User.findById(sender);

          const _GroupMessage = {
            _id,
            sender,
            recipients,
            messageType,
            message: {
              audioId: uploadStream.id,
            },
            conversationType,
            conversationId,
            createdAt,
            updatedAt,
          };
          await Message.create(_GroupMessage);
          io.to(from_user_group?.socket_id).emit("update_msg_status", {
            messageId: _GroupMessage?._id,
            conversationId,
            conversationType,
          });

          const socket_ids = recipients.map(async (id) => {
            const { socket_id } =
              await User.findById(id).select("socket_id -_id");
            return socket_id;
          });

          Promise.all(socket_ids)
            .then((Sockets) => {
              Sockets.forEach((socketId) => {
                if (socketId) {
                  io.to(socketId).emit("new_message", _GroupMessage);
                } else {
                  console.error("Encountered a null or undefined socket ID.");
                }
              });
            })
            .catch(() => console.log("error will finding scoket ids"));

          break;
        default:
          break;
      }

      socket.emit("uploadSuccess", { id: uploadStream.id });
    });

    uploadStream.on("error", (err) => {
      console.error("Upload error:", err);
      socket.emit("uploadError", "Error storing audio");
    });
  });

  socket.on("media_message", async (data) => {
    const {
      _id,
      sender,
      recipients,
      messageType,
      message,
      conversationType,
      conversationId,
      createdAt,
      updatedAt,
    } = data;
    const { file, text } = message;
    // upload file to cloudinary
    const img = await v2.uploader.upload(file[0].blob);

    switch (conversationType) {
      case "OneToOneMessage":
        const msg_receiver = await User.findById(recipients);
        const msg_sender = await User.findById(sender);
        const _Message = {
          _id,
          sender,
          recipients,
          messageType,
          message: {
            photoUrl: img?.secure_url,
            description: text || "",
          },
          conversationType,
          conversationId,
          createdAt,
          updatedAt,
        };
        await Message.create(_Message);

        // emit incoming_message -> to user
        io.to(msg_receiver?.socket_id).emit("new_message", _Message);
        // emit outgoing_message -> from user
        io.to(msg_sender?.socket_id).emit("update_msg_status", {
          messageId: _Message?._id,
          conversationId,
          conversationType,
        });
        break;
      case "OneToManyMessage":
        const from_user_group = await User.findById(sender);

        const _GroupMessage = {
          _id,
          sender,
          recipients,
          messageType,
          message: {
            photoUrl: img?.secure_url,
            description: text || "",
          },
          conversationType,
          conversationId,
          createdAt,
          updatedAt,
        };
        await Message.create(_GroupMessage);
        io.to(from_user_group?.socket_id).emit("update_msg_status", {
          messageId: _GroupMessage?._id,
          conversationId,
          conversationType,
        });

        const socket_ids = recipients.map(async (id) => {
          const { socket_id } =
            await User.findById(id).select("socket_id -_id");
          return socket_id;
        });

        Promise.all(socket_ids)
          .then((Sockets) => {
            Sockets.forEach((socketId) => {
              if (socketId) {
                io.to(socketId).emit("new_message", _GroupMessage);
              } else {
                console.error("Encountered a null or undefined socket ID.");
              }
            });
          })
          .catch(() => console.log("error will finding scoket ids"));
        break;
      default:
        break;
    }
  });

  //  direct 'upload_camera_picture' msg event
  socket.on("upload_camera_picture", async (data) => {
    const {
      _id,
      sender,
      recipients,
      messageType,
      message,
      conversationType,
      conversationId,
      createdAt,
      updatedAt,
    } = data;
    const { file, text } = message;
    try {
      // Upload file to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = v2.uploader.upload_stream((error, result) => {
          if (error) reject(error);
          else resolve(result);
        });

        streamifier.createReadStream(file).pipe(uploadStream);
      });

      switch (conversationType) {
        case "OneToOneMessage":
          const msg_receiver = await User.findById(recipients);
          const msg_sender = await User.findById(sender);
          const _Message = {
            _id,
            sender,
            recipients,
            messageType,
            message: {
              photoUrl: result?.secure_url,
              description: text || "",
            },
            conversationType,
            conversationId,
            createdAt,
            updatedAt,
          };
          await Message.create(_Message);

          // emit incoming_message -> to user
          io.to(msg_receiver?.socket_id).emit("new_message", _Message);
          // emit outgoing_message -> from user
          io.to(msg_sender?.socket_id).emit("update_msg_status", {
            messageId: _Message?._id,
            conversationId,
            conversationType,
          });
          break;
        case "OneToManyMessage":
          const from_user_group = await User.findById(sender);

          const _GroupMessage = {
            _id,
            sender,
            recipients,
            messageType,
            message: {
              photoUrl: result?.secure_url,
              description: text || "",
            },
            conversationType,
            conversationId,
            createdAt,
            updatedAt,
          };
          await Message.create(_GroupMessage);

          io.to(from_user_group?.socket_id).emit("update_msg_status", {
            messageId: _GroupMessage?._id,
            conversationId,
            conversationType,
          });

          const socket_ids = recipients.map(async (id) => {
            const { socket_id } =
              await User.findById(id).select("socket_id -_id");
            return socket_id;
          });

          Promise.all(socket_ids)
            .then((Sockets) => {
              Sockets.forEach((socketId) => {
                if (socketId) {
                  io.to(socketId).emit("new_message", _GroupMessage);
                } else {
                  console.error("Encountered a null or undefined socket ID.");
                }
              });
            })
            .catch(() => console.log("error will finding scoket ids"));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Upload failed:", error);

      // Emit an error message to the client
      // socket.emit("upload_error", "Failed to upload image");
    }
  });

  // update unreadMsgs to db event
  socket.on("update_unreadMsgs", async (message) => {
    switch (message?.conversationType) {
      case "OneToOneMessage":
        const to_user = await User.findById(message.recipients);
        io.to(to_user?.socket_id).emit("on_update_unreadMsg", message);
        break;
      case "OneToManyMessage":
        const socket_ids = message.recipients.map(async (id) => {
          const { socket_id } =
            await User.findById(id).select("socket_id -_id");
          return socket_id;
        });
        Promise.all(socket_ids)
          .then((Sockets) => {
            Sockets.forEach((socketId) => {
              if (socketId) {
                io.to(socketId).emit("on_update_unreadMsg", message);
              } else {
                console.error("Encountered a null or undefined socket ID.");
              }
            });
          })
          .catch(() => console.log("error will finding scoket ids"));
        break;
      default:
        break;
    }
  });

  // clear unread messages event
  socket.on("clear_unread", async (data) => {
    const { conversationId, recipients, sender } = data;
    const recordsfound = await Message.updateMany(
      { conversationId, recipients },
      { $set: { isRead: true } }
    );
    console.log(recordsfound);

    const from_user = await User.findById(sender);
    console.log(from_user);

    io.to(from_user?.socket_id).emit("all_msg_seen", conversationId);
  });

  // // show Typing - Stop_Typing status event
  // socket.on("Typing", async (data) => {
  //   const { room_id, currentUser, type, current_conversation } = data;
  //   const { admin } = await OneToManyMessage.findById(room_id);
  //   switch (type) {
  //     case "individual":
  //       const { socket_id } =
  //         await User.findById(current_conversation).select("socket_id -_id");
  //       io.to(socket_id).emit("Is_Typing", {
  //         userName: currentUser.userName,
  //         room_id,
  //       });
  //       console.log("emiiter");
  //       break;
  //     case "group":
  //       const TypingStatSendto = [
  //         ...current_conversation,
  //         admin.toString(),
  //       ].filter((id) => id !== currentUser.auth_id.toString());
  //       const socket_ids = TypingStatSendto.map(async (id) => {
  //         const { socket_id } =
  //           await User.findById(id).select("socket_id -_id");
  //         return socket_id;
  //       });
  //       Promise.all(socket_ids)
  //         .then((Sockets) => {
  //           Sockets.forEach((socketId) => {
  //             if (socketId) {
  //               const socketExists = io.sockets.sockets.get(socketId);
  //               if (socketExists) {
  //                 io.to(socketId).emit("Is_Typing", {
  //                   userName: currentUser.userName,
  //                   room_id,
  //                 });
  //               } else {
  //                 console.error(`Socket ID not connected: ${socketId}`);
  //               }
  //             } else {
  //               console.error("Encountered a null or undefined socket ID.");
  //             }
  //           });
  //         })
  //         .catch(() => console.log("error will finding scoket ids"));

  //       break;
  //     default:
  //       console.log("type is not mentioned unable to emit typing event");
  //       break;
  //   }
  // });

  // socket.on("Stop_Typing", async (data) => {
  //   const { room_id, currentUser, type, current_conversation } = data;
  //   const { admin } = await OneToOneMessage.findById(room_id);
  //   switch (type) {
  //     case "individual":
  //       const { socket_id } =
  //         await User.findById(current_conversation).select("socket_id -_id");
  //       io.to(socket_id).emit("Is_Stop_Typing", {
  //         userName: currentUser.userName,
  //         room_id,
  //       });
  //       break;
  //     case "group":
  //       const TypingStatSendto = [
  //         ...current_conversation,
  //         admin.toString(),
  //       ].filter((id) => id !== currentUser.auth_id.toString());
  //       const socket_ids = TypingStatSendto.map(async (id) => {
  //         const { socket_id } =
  //           await User.findById(id).select("socket_id -_id");
  //         return socket_id;
  //       });
  //       Promise.all(socket_ids)
  //         .then((Sockets) => {
  //           Sockets.forEach((socketId) => {
  //             if (socketId) {
  //               const socketExists = io.sockets.sockets.get(socketId);
  //               if (socketExists) {
  //                 io.to(socketId).emit("Is_Stop_Typing", {
  //                   userName: currentUser.userName,
  //                   room_id,
  //                 });
  //               } else {
  //                 console.error(`Socket ID not connected: ${socketId}`);
  //               }
  //             } else {
  //               console.error("Encountered a null or undefined socket ID.");
  //             }
  //           });
  //         })
  //         .catch(() => console.log("error will finding scoket ids"));
  //       break;
  //     default:
  //       console.log("type is not mentioned unable to emit typing event");
  //       break;
  //   }
  // });

  // msg has read by the recipient

  // exit event
  socket.on("exit", async (data) => {
    const { user_id, friends } = data;
    if (user_id) {
      const user = await User.findByIdAndUpdate(
        user_id, // user id
        {
          socket_id: socket.id, // update
          status: "Offline",
        },
        { new: true } // return updated doc
      );

      const socket_ids = friends?.map(async (id) => {
        const { socket_id } = await User.findById(id).select("socket_id -_id");
        return socket_id;
      });
      const EmmitStatusTo = await Promise.all(socket_ids);
      EmmitStatusTo.forEach((socketId) => {
        if (socketId) {
          const socketExists = io.sockets.sockets.get(socketId);
          if (socketExists) {
            io.to(socketId).emit("user_status_update", {
              id: user_id,
              status: "Offline",
            });
          } else {
            console.error(`Socket ID not connected: ${socketId}`);
          }
        } else {
          console.error("Encountered a null or undefined socket ID.");
        }
      });
    }

    // Todo broadcast user disconnection;

    // console.log("closing connection");
    socket.disconnect(0);
  });

  // socket.on("disconnect", (socket) => {
  //   console.log("user disconnected",socket.id);
  // });
});

export { server };
