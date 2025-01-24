import React, { useCallback, useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import { SelectConversation } from "../../store/slices/appSlice.js";
import { socket } from "../../socket.js";
import ConversationElement from "./ConversationElement.jsx";
import {
  addDirectConversation,
  updateDirectConversation,
} from "../../store/slices/conversation.js";
import { RxCross2 } from "react-icons/rx";
import ShowOffline from "../ShowOffline/ShowOffline.jsx";
const DirectConversation = () => {
  const dispatch = useDispatch();
  const [searchvalue, setSearchvalue] = useState("");
  const { _id: auth_id } = useSelector((state) => state.auth.user);
  const { OnlineStatus } = useSelector((state) => state.app);
  const {
    DirectConversations,
    current_direct_messages,
    current_direct_conversation,
  } = useSelector((state) => state.conversation.direct_chat);
  const [Conversations, setConversations] = useState(DirectConversations);

  useEffect(() => {
    setConversations(DirectConversations);
  }, [DirectConversations]);

  const hasPinnedConversations = Conversations.some(
    (el) => el?.pinned == "true"
  );

  useEffect(() => {
    if (current_direct_messages?.length > 0) {
      dispatch(
        updateDirectConversation({
          ...current_direct_conversation,
          outgoing: current_direct_messages?.slice(-1)[0]?.outgoing,
          msg: {
            type: current_direct_messages?.slice(-1)[0]?.type,
            message: current_direct_messages?.slice(-1)[0]?.message,
            createdAt: current_direct_messages?.slice(-1)[0]?.createdAt,
          },
          time: current_direct_messages?.slice(-1)[0]?.createdAt,
          seen: current_direct_messages?.slice(-1)[0]?.seen,
        })
      );
    }
  }, [current_direct_messages]);

  useEffect(() => {
    const handleStartChat = (data) => {
      const existing_conversation = DirectConversations.find(
        (el) => el.id === data._id
      );
      if (existing_conversation) {
        dispatch(updateDirectConversation(data));
      } else {
        const user = data?.participants?.filter((el) => el._id !== auth_id);
        let conversation = {};
        conversation["_id"] = data._id;
        conversation["messages"] = [];
        conversation["user"] = user[0];
        dispatch(addDirectConversation({ auth: user, conversation }));
      }
      dispatch(SelectConversation({ room_id: data._id }));
    };
    socket.on("start_chat", handleStartChat);
    return () => {
      socket?.off("start_chat");
    };
  }, [DirectConversations]);

  const handleInputChange = useCallback(
    (e) => {
      let value = e.target.value.toLowerCase();
      const regex = new RegExp(`^${value?.trim()}`, "i");
      const filteredConversations = value
        ? DirectConversations.filter((el) => regex.test(el.name.toLowerCase()))
        : DirectConversations;
      setConversations(filteredConversations);
      setSearchvalue(value);
    },
    [DirectConversations, Conversations, searchvalue]
  );
  const handleResetSearchvalue = useCallback(() => {
    setSearchvalue("");
    setConversations(DirectConversations);
  }, [DirectConversations]);

  const TotalMessages = useCallback(() => {
    return DirectConversations?.reduce((acc, val) => acc + val.unread, 0);
  }, [DirectConversations]);

  return (
    <>
      <div className={`chats_Sections`}>
        <div className="Top_Section">
          <div className="Top_bar">
            <p className="left title">Chats</p>
          </div>
          <div className="Search_box bottom_bar">
            <CiSearch className="searchicon" />
            <input
              type="text"
              className="Search_inpt"
              placeholder="Search a chat"
              value={searchvalue}
              onChange={(e) => setSearchvalue(e.target.value)}
              onInput={handleInputChange}
            />
            {searchvalue && (
              <RxCross2
                className="clear_search"
                onClick={handleResetSearchvalue}
              />
            )}
          </div>
        </div>
        <div className="Chats_Container">
          {!OnlineStatus && <ShowOffline />}
          <>
            {DirectConversations.length > 0 ? (
              <>
                {hasPinnedConversations && (
                  <div className="Pinned_Chats_Container">
                    <p className="title">Pinned</p>
                    <div className="Pinned_Chats">
                      {Conversations.filter((el) => el.pinned).map(
                        (chat, index) => {
                          return (
                            <ConversationElement chat={chat} key={index} />
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
                <div className="All_Chats_Container">
                  <p className="title">
                    Messages{" "}
                    {TotalMessages() ? (
                      <span className="totalmessages">
                        {TotalMessages() > 99 ? "99+" : TotalMessages()}
                      </span>
                    ) : (
                      ""
                    )}
                  </p>
                  <div className="All_Chats">
                    {Conversations.filter((el) => !el.pinned).map(
                      (chat, index) => {
                        return <ConversationElement chat={chat} key={index} />;
                      }
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="No_Conversation">
                <p className="title">No Chats</p>
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};

export default DirectConversation;
