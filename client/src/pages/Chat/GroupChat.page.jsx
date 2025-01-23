import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import GroupConversations from "../../components/GroupChatpage/GroupConversations";
import { useExistingGroupConversationsQuery } from "../../store/slices/apiSlice";
import {
  fetchGroupConversations,
  ResetGroupChat,
} from "../../store/slices/conversation";
import Chat from "../../components/Conversation/Chat";
import Contact from "../../components/Contact/Contact";
import SharedMsgs from "../../components/Contact/SharedMsgs";
import { ResetChatRoomId, toggleSideBar } from "../../store/slices/appSlice";
import Loader from "../../components/Loader/Loader";
const GroupChat = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { sideBar, room_id } = useSelector((state) => state.app);

  const { data, isLoading, isSuccess } = useExistingGroupConversationsQuery();

  // Runs when component UnMounts
  useEffect(() => {
    return () => {
      dispatch(ResetChatRoomId()); //clears room Id
      dispatch(ResetGroupChat()); // clears current_group_conversation && current_group_messages
      dispatch(toggleSideBar({ open: false }));
    };
  }, []);
  useEffect(() => {
    isSuccess &&
      dispatch(
        fetchGroupConversations({ conversations: data.data, auth: user })
      );
  }, [isSuccess]);
  return (
    <div className="chat_page">
      {!isLoading ? (
        <>
          <div className={`Conversations ${room_id ? "Chat_Selected" : ""}`}>
            <GroupConversations />
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

export default GroupChat;
