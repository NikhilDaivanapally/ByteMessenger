const { default: mongoose } = require("mongoose");

const unreadMessageSchema = new mongoose.Schema(
  {
    message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    }, // Reference to the unread message
    // conversationType: {
    //   type: String,
    //   enum: ["OneToOneMessage", "OneToManyMessage"],
    //   required: true,
    // }, // Indicates the type of conversation
    // conversationRef: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    // }, // Reference to the specific conversation
  },
  { timestamps: true }
);

const UnreadMessage = mongoose.model("UnreadMessage", unreadMessageSchema);

module.exports = UnreadMessage;
