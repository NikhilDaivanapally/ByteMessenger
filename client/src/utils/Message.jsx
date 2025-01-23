import React from "react";
import { IoMic } from "react-icons/io5";
import { MdOutlineCameraAlt } from "react-icons/md";

const Message = (msg) => {
  let message;
  switch (msg?.type) {
    case "photo":
      message = (
        <>
          <MdOutlineCameraAlt />
          <>{msg?.message?.description ? msg?.message?.description : "Photo"}</>
        </>
      );
      break;
    case "audio":
      message = (
        <>
          <IoMic />
          <>Audio</>
        </>
      );
      break;
    case "text":
      message = msg?.message?.text;
      break;
    case "link":
      message = msg?.message?.text;

    default:
      break;
  }
  return { message };
};

export default Message;
