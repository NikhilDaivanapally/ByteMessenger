import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ResetDirectChat } from "../../store/slices/conversation";
import Contact from "../../components/Contact/Contact";
import SharedMsgs from "../../components/Contact/SharedMsgs";
import Chat from "../../components/Conversation/Chat";
import { ResetChatRoomId, toggleSideBar } from "../../store/slices/appSlice";
import Loader from "../../components/Loader/Loader";
import DirectConversation from "../../components/DirectChatpage/DirectConversation";
const DirectChat = () => {
  const dispatch = useDispatch();
  const { sideBar, room_id } = useSelector((state) => state.app);
  // individual Conversations
  const { DirectConversations } = useSelector(
    (state) => state.conversation.direct_chat
  );

  // Runs When component UnMounts
  useEffect(() => {
    return () => {
      dispatch(ResetChatRoomId()); //clears room Id
      dispatch(ResetDirectChat()); // clears current_direct_conversation && current_direct_messages
      dispatch(toggleSideBar({ open: false }));
    };
  }, []);

  return (
    <div className="chat_page">
      {DirectConversations ? (
        <>
          <div className={`Conversations ${room_id ? "Chat_Selected" : ""}`}>
            <DirectConversation />
          </div>
          <div className={`Current_Chat ${room_id ? "ActiveChat" : ""} `}>
            <Chat />
            {(() => {
              switch (sideBar.type) {
                case "CONTACT":
                  return <Contact />;
                case "STARRED":
                  return <></>;
                case "SHARED":
                  return <SharedMsgs />;
                default:
                  return null;
              }
            })()}
          </div>
        </>
      ) : (
        <Loader />
      )}
    </div>
  );
};

export default DirectChat;
