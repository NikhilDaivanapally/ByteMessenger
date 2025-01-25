import React, { useCallback, useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";

import { useDispatch, useSelector } from "react-redux";
import {
  addGroupConversation,
  updateGroupConversation,
} from "../../store/slices/conversation";
import GroupDialog from "./GroupDialog/GroupDialog";
import { socket } from "../../socket";
import Groupchat from "./Groupchat";
import { SelectConversation } from "../../store/slices/appSlice";
import { RxCross2 } from "react-icons/rx";
import ShowOffline from "../ShowOffline/ShowOffline";
const GroupConversations = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchvalue, setSearchvalue] = useState("");
  const dispatch = useDispatch();
  const { OnlineStatus } = useSelector((state) => state.app);
  const {
    GroupConversations,
    current_group_conversation,
    current_group_messages,
  } = useSelector((state) => state.conversation.group_chat);
  const user = useSelector((state) => state.auth.user);
  const [Conversations, setConversations] = useState(GroupConversations);
  useEffect(() => {
    setConversations(GroupConversations);
  }, [GroupConversations]);

  const handleopenDialog = () => {
    setOpenDialog(true);
  };
  const handlecloseDialog = () => {
    setOpenDialog(false);
  };
  // returns true if GroupConversations had an pinned one's else returns false
  const hasPinnedConversations = Conversations?.some(
    (el) => el.pinned == "true"
  );

  useEffect(() => {
    if (current_group_messages?.length > 0) {
      dispatch(
        updateGroupConversation({
          ...current_group_conversation,
          outgoing: current_group_messages?.slice(-1)[0]?.outgoing,
          msg: {
            type: current_group_messages?.slice(-1)[0]?.type,
            message: current_group_messages?.slice(-1)[0]?.message,
            createdAt: current_group_messages?.slice(-1)[0]?.createdAt,
          },
          from: current_group_messages?.slice(-1)[0]?.from,
          time: current_group_messages?.slice(-1)[0]?.createdAt,
          seen: current_group_messages?.slice(-1)[0]?.seen,
        })
      );
    }
  }, [current_group_messages]);
  useEffect(() => {
    const handlenewGroupChat = (data) => {
      console.log(data);

      const existing_conversation = GroupConversations?.find(
        (el) => el.id === data._id
      );
      if (existing_conversation) {
        dispatch(updateGroupConversation(data));
      } else {
        // add direct conversation
        dispatch(addGroupConversation({ auth: user, conversation: data }));
      }
    };
    socket.on("new_groupChat", handlenewGroupChat);
    return () => {
      socket.off("new_groupChat", handlenewGroupChat);
    };
  }, []);

  useEffect(() => {
    const handlenewGroupChat = (data) => {
      const existing_conversation = GroupConversations?.find(
        (el) => el.id === data._id
      );
      if (existing_conversation) {
        dispatch(updateGroupConversation(data));
      } else {
        // add direct conversation
        dispatch(addGroupConversation({ auth: user, conversation: data }));
      }
      dispatch(SelectConversation({ room_id: data._id }));
      handlecloseDialog();
    };
    socket.on("new_groupChat_admin", handlenewGroupChat);
    return () => {
      socket.off("new_groupChat_admin", handlenewGroupChat);
    };
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      let value = e.target.value.toLowerCase();
      const regex = new RegExp(`^${value?.trim()}`, "i");
      const filteredConversations = value
        ? GroupConversations?.filter((el) => regex.test(el.title.toLowerCase()))
        : GroupConversations;
      setConversations(filteredConversations);
      setSearchvalue(value);
    },
    [GroupConversations, searchvalue, Conversations]
  );

  const handleResetSearchvalue = useCallback(() => {
    setSearchvalue("");
    setConversations(GroupConversations);
  }, [Conversations]);
  return (
    <>
      <div className={`chats_Sections`}>
        <div className="Top_Section">
          <div className="Top_bar">
            <p className="left title">Group</p>
            {/* createNewGroup */}
            <button className="Create_group" onClick={handleopenDialog}>
              Create Group
              <FaPlus />
            </button>
          </div>
          <div className="Search_box bottom_bar">
            <CiSearch className="search_icon" />
            <input
              type="text"
              className="Search_inpt"
              placeholder="Search..."
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
            {GroupConversations?.length > 0 ? (
              <>
                {hasPinnedConversations && (
                  <div className="Pinned_Chats_Container">
                    <p className="title">Pinned</p>
                    <div className="Pinned_Chats">
                      {Conversations?.filter((el) => el.pinned).map(
                        (chat, index) => {
                          return <Groupchat chat={chat} key={index} />;
                        }
                      )}
                    </div>
                  </div>
                )}
                <div className="All_Chats_Container">
                  <p className="title">Group Messages</p>
                  <div className="All_Chats">
                    {Conversations?.filter((el) => !el.pinned).map(
                      (chat, index) => {
                        return <Groupchat chat={chat} key={index} />;
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
      {openDialog && (
        <GroupDialog
          openDialog={openDialog}
          handlecloseDialog={handlecloseDialog}
        />
      )}
    </>
  );
};

export default GroupConversations;
