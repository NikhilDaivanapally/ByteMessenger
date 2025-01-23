import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentDirectMessages,
  updateDirectConversation,
} from "../../store/slices/conversation";
import { SelectConversation } from "../../store/slices/appSlice";
import { socket } from "../../socket";
import ConversationTime from "../../utils/ConversationTime";
import Message from "../../utils/Message";

const ConversationElement = ({ chat }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth.user);
  const { DirectConversations } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { room_id } = useSelector((state) => state.app);

  const {
    id,
    user_id,
    name,
    avatar,
    online,
    msg,
    seen,
    outgoing,
    time,
    unread,
    pinned,
    about,
  } = chat;

  const Time = ConversationTime(time);
  const { message } = Message(msg);

  const handleSelectConversation = useCallback(() => {
    dispatch(setCurrentDirectMessages([]));
    dispatch(SelectConversation({ room_id: id }));
    const [updateConversation] = DirectConversations.filter(
      (el) => el.id == id
    );
    if (updateConversation.unread) {
      socket.emit("clear_unread", {
        conversationId: id,
        recipients: auth._id,
        sender: user_id,
      });
      dispatch(
        updateDirectConversation({
          ...updateConversation,
          unread: 0,
        })
      );
    }
  }, [DirectConversations]);

  return (
    <div
      className={`friend ${room_id == id && "selected"}`}
      onClick={handleSelectConversation}
    >
      <div className="image_container">
        <img src={avatar} alt="" />
        {online && <span className="online_offline"></span>}
      </div>
      <div className="info">
        <p className="friend_name">{name}</p>
        <span className="friend_msg">
          {outgoing ? "You - " : ""}
          {message}
        </span>
      </div>
      <div className="lasttime_noof_msg">
        <div className="seen_time">
          {outgoing ? (
            <div className="dot_container">
              <div className={`dot ${seen ? "seen" : "unseen"}`}></div>
              <div className={`dot ${seen ? "seen" : "unseen"}`}></div>
            </div>
          ) : (
            ""
          )}
          <span className="lasttime_msg">{Time}</span>
        </div>
        {Boolean(unread) && (
          <span className="noof_msg">
            {unread > 99 ? `${unread}+` : unread}
          </span>
        )}
      </div>
    </div>
  );
};

export default ConversationElement;
