import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentGroupMessages,
  updateGroupConversation,
} from "../../store/slices/conversation";
import { SelectConversation } from "../../store/slices/appSlice";
import { GrGroup } from "react-icons/gr";
import ConversationTime from "../../utils/ConversationTime";
import Message from "../../utils/Message.jsx";
import SenderFromGroup from "../../utils/SenderFromGroup.jsx";

const Groupchat = ({ chat }) => {
  const dispatch = useDispatch();
  const { GroupConversations } = useSelector(
    (state) => state.conversation.group_chat
  );
  const { room_id } = useSelector((state) => state.app);
  const { id, img, title, msg, time, unread, outgoing, from } = chat;
  const { sender } = SenderFromGroup(chat);
  const Time = ConversationTime(time);
  const { message } = Message(msg);

  const handleSelectConversation = () => {
    dispatch(setCurrentGroupMessages([]));
    dispatch(SelectConversation({ room_id: id }));
    const [updateConversation] = GroupConversations.filter((el) => el.id == id);
    if (Number(updateConversation.unread)) {
      // socket.emit("clear_unread", { conversation_id: id });
      dispatch(
        updateGroupConversation({
          ...updateConversation,
          unread: 0,
        })
      );
    }
  };
  return (
    <div
      className={`friend ${room_id == id && "selected"}`}
      onClick={handleSelectConversation}
    >
      <div className="image_container">
        {img ? <img src={img} alt="" /> : <GrGroup className="no_img" />}
      </div>
      <div className="info">
        <p className="friend_name">{title}</p>
        <span className="friend_msg">
          {outgoing
            ? "You - "
            : `${sender?.userName ? `${sender?.userName} - ` : ""}`}
          {message}
        </span>
      </div>
      <div className="lasttime_noof_msg">
        <span className="lasttime_msg">{Time}</span>
        {Boolean(unread) && (
          <span className="noof_msg">
            {unread > 99 ? `${unread}+` : unread}
          </span>
        )}
      </div>
    </div>
  );
};

export default Groupchat;
