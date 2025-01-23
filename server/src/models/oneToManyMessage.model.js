import mongoose from "mongoose";

const oneToManyMessageSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    title: {
      type: String,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true }
);

const OneToManyMessage = mongoose.model(
  "OneToManyMessage",
  oneToManyMessageSchema
);

export default OneToManyMessage;
