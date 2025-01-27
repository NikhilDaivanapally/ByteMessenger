import React from "react";
import { useSelector } from "react-redux";
import { RxCross2 } from "react-icons/rx";
import { FaUserCircle } from "react-icons/fa";
import { BsChatRightTextFill } from "react-icons/bs";
import { socket } from "../../../../socket";
import { useNavigate } from "react-router-dom";
const User = ({ _id, userName, avatar, socket_id }) => {
  const auth_user = useSelector((state) => state.auth.user);
  return (
    <div className="user">
      <div className="img_contatiner">
        {avatar ? (
          <img src={avatar} alt="" />
        ) : (
          <FaUserCircle className="avatar" />
        )}
        {/* {online && <span className="online_offline"></span>} */}
      </div>
      <div className="info">
        <p>{userName}</p>
      </div>
      <button
        className="AddTo_friend"
        onClick={() => {
          socket.emit("friend_request", {
            recipient: _id,
            sender: auth_user._id,
          });
        }}
      >
        send Request
        {/* <IoIosAdd /> */}
      </button>
    </div>
  );
};

const FriendRequest = ({ _id, sender }) => {
  const auth_user = useSelector((state) => state.auth.user);
  return (
    <div className="user">
      <div className="img_contatiner">
        {sender.avatar ? (
          <img src={sender.avatar} alt="" />
        ) : (
          <FaUserCircle className="avatar" />
        )}
        {sender.status && <span className="online_offline"></span>}
      </div>
      <div className="info">
        <p>{sender.userName}</p>
      </div>
      <div className="controls">
        {sender?._id !== auth_user?._id ? (
          <>
            <button
              onClick={() => {
                socket.emit("accept_friendrequest", { request_id: _id });
              }}
            >
              Accept
            </button>
            <button>Reject</button>
          </>
        ) : (
          <button style={{ cursor: "default" }}>Request Sent</button>
        )}
      </div>
    </div>
  );
};

const Friend = ({ _id, userName, avatar, online }) => {
  const auth_user = useSelector((state) => state.auth.user);
  const Navigate = useNavigate();
  return (
    <div className="user">
      <div className="img_contatiner">
        {avatar ? (
          <img src={avatar} alt="" />
        ) : (
          <FaUserCircle className="avatar" />
        )}
        {online && <span className="online_offline">{userName}</span>}
      </div>
      <div className="info">
        <p>{userName}</p>
      </div>

      <div className="controls">
        <BsChatRightTextFill
          className="msg"
          onClick={() => {
            socket.emit("start_conversation", {
              to: _id,
              from: auth_user._id,
            });
            Navigate("/");
            // start a new conversation
          }}
        />
        <RxCross2 className="remove" />
      </div>
    </div>
  );
};
export { User, FriendRequest, Friend };
