import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  direct_chat: {
    DirectConversations: null,
    current_direct_conversation: null,
    current_direct_messages: [],
  },
  group_chat: {
    GroupConversations: null,
    current_group_conversation: null,
    current_group_messages: [],
  },
  fullImagePreview: null,
};
const slice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    // initial conversation adding to the store
    fetchDirectConversations(state, action) {
      const list = action.payload?.conversations?.map((el) => {
        const unreadMssLength = el?.messages.filter(
          (msg) =>
            msg.recipients == action?.payload?.auth?._id && msg.isRead == false
        );
        const user = el?.user;
        if (el.messages.length > 0) {
          return {
            id: el?._id,
            user_id: user?._id,
            name: user?.userName,
            online: user?.status === "Online",
            avatar: user?.avatar,
            msg: {
              type: el?.messages?.slice(-1)[0]?.messageType,
              message: el?.messages?.slice(-1)[0]?.message,
              createdAt: el?.messages?.slice(-1)[0]?.createdAt,
            },
            unread: unreadMssLength.length,
            seen: el?.messages?.slice(-1)[0]?.isRead,
            outgoing:
              el?.messages?.slice(-1)[0]?.sender.toString() ===
              action?.payload?.auth?._id.toString(),
            time: el?.messages?.slice(-1)[0]?.createdAt,
            pinned: false,
            about: user?.about,
          };
        } else {
          return null;
        }
      });
      const filterList = list.filter((val) => val);
      filterList.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
      state.direct_chat.DirectConversations = filterList;
    },
    fetchGroupConversations(state, action) {
      const list = action.payload?.conversations?.map((el) => {
        const unreadMssLength = el?.messages?.filter(
          (msg) =>
            msg.recipients.includes(action?.payload?.auth?._id) &&
            msg.isRead == false
        );

        return {
          id: el?._id,
          title: el?.title,
          img: el?.avatar,
          users: el?.participants,
          admin: el?.admin,

          msg: {
            type: el?.messages?.slice(-1)[0]?.messageType,
            message: el?.messages?.slice(-1)[0]?.message,
            createdAt: el?.messages?.slice(-1)[0]?.createdAt,
          },
          from: el?.messages?.slice(-1)[0]?.sender,
          outgoing:
            el?.messages?.slice(-1)[0]?.sender.toString() ===
            action?.payload?.auth?._id.toString(),
          time: el?.messages?.slice(-1)[0]?.createdAt || "",
          unread: unreadMssLength?.length,
          seen: el?.messages?.slice(-1)[0]?.isRead,
        };
      });

      const hasTime = list.filter((el) => el.time);
      hasTime.sort((a, b) => Date.parse(b?.time) - Date.parse(a?.time));

      const hasnoTime = list.filter((el) => !el.time);

      const filterList = [...hasTime, ...hasnoTime];
      state.group_chat.GroupConversations = filterList;
    },

    // updating a conversation
    updateDirectConversation(state, action) {
      const list = state.direct_chat?.DirectConversations?.map((el) => {
        if (el?.id !== action.payload?.id) {
          return el;
        } else {
          return action.payload;
        }
      });
      const filterList = list.filter((val) => val);
      filterList.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
      state.direct_chat.DirectConversations = filterList;
    },
    updateGroupConversation(state, action) {
      const list = state.group_chat.GroupConversations.map((el) => {
        if (el?.id !== action.payload?.id) {
          return el;
        } else {
          return action.payload;
        }
      });
      const filterList = list.filter((val) => val);
      filterList.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
      state.group_chat.GroupConversations = filterList;
    },

    // adding a conversation
    addDirectConversation(state, action) {
      const this_conversation = action.payload.conversation;
      const unreadMssLength = this_conversation?.messages?.filter(
        (msg) =>
          msg.recipients == action?.payload?.auth?._id && msg.isRead == false
      );
      const user = this_conversation?.user;
      state.direct_chat.DirectConversations =
        state.direct_chat.DirectConversations?.filter(
          (el) => el?.id !== this_conversation._id
        );
      state.direct_chat.DirectConversations?.push({
        id: this_conversation?._id,
        user_id: user?._id,
        name: user?.userName,
        online: user?.status === "Online",
        avatar: user?.avatar,
        msg: {
          type: this_conversation?.messages?.slice(-1)[0]?.messageType,
          message: this_conversation?.messages?.slice(-1)[0]?.message,
          createdAt: this_conversation?.messages?.slice(-1)[0]?.createdAt,
        },
        unread: unreadMssLength?.length,
        seen: this_conversation?.messages?.slice(-1)[0]?.isRead,
        outgoing:
          this_conversation?.messages?.slice(-1)[0]?.sender.toString() ===
          action?.payload?.auth?._id.toString(),
        time: this_conversation?.messages?.slice(-1)[0]?.createdAt || "",
        pinned: false,
        about: user?.about,
      });
    },
    addGroupConversation(state, action) {
      const this_conversation = action.payload.conversation;
      state.group_chat.GroupConversations =
        state.group_chat.GroupConversations.filter(
          (el) => el?.id !== this_conversation._id
        );
      state.group_chat.GroupConversations.push({
        id: this_conversation?._id,
        title: this_conversation?.title,
        img: this_conversation?.avatar,
        admin: this_conversation?.admin,
        users: this_conversation?.participants,
        msg: {
          type: this_conversation?.messages?.slice(-1)[0]?.messageType,
          message: this_conversation?.messages?.slice(-1)[0]?.message,
          createdAt: this_conversation?.messages?.slice(-1)[0]?.createdAt,
        },

        from: this_conversation?.messages?.slice(-1)[0]?.sender,
        outgoing:
          this_conversation?.messages?.slice(-1)[0]?.sender.toString() ===
          action?.payload.auth?._id.toString(),
        time: this_conversation?.messages?.slice(-1)[0]?.createdAt || "",
        seen: this_conversation?.messages?.slice(-1)[0]?.isRead,
        unread: 0,
      });
    },

    // initial messages adding to the store
    fetchCurrentDirectMessages(state, action) {
      const messages = action.payload.messages;
      if (messages?.length > 0) {
        const formatted_messages = messages.map((el) => {
          return {
            id: el?._id,
            type: el?.messageType,
            message: el?.message,
            createdAt: el?.createdAt,
            updateAt: el?.updateAt,
            incoming: el?.recipients == action?.payload?.auth?._id,
            outgoing: el?.sender == action?.payload?.auth?._id,
            status: "sent",
            seen: el?.isRead,
          };
        });
        state.direct_chat.current_direct_messages = formatted_messages;
      }
    },
    fetchCurrentGroupMessages(state, action) {
      const messages = action.payload.messages;
      if (messages.length > 0) {
        const formatted_messages = messages?.map((el) => ({
          id: el?._id,
          type: el?.messageType,
          message: el?.message,
          createdAt: el?.createdAt,
          updateAt: el?.updateAt,
          incoming: el?.recipients.includes(action?.payload?.auth?._id),
          outgoing: el?.sender == action?.payload?.auth?._id,
          from: el?.sender,
          status: "sent",
          conversationId: el?.conversationId,
          seen: el?.isRead,
        }));
        state.group_chat.current_group_messages = formatted_messages;
      }
    },

    // make conversation empty
    setCurrentDirectConversation(state, action) {
      state.direct_chat.current_direct_conversation = action.payload;
    },
    setCurrentGroupConversation(state, action) {
      state.group_chat.current_group_conversation = action.payload;
    },

    // make messages empty
    setCurrentDirectMessages(state, action) {
      state.direct_chat.current_direct_messages = action.payload;
    },
    setCurrentGroupMessages(state, action) {
      state.group_chat.current_group_messages = action.payload;
    },

    // add a message
    addDirectMessage(state, action) {
      const current_messages = state.direct_chat.current_direct_messages;
      if (current_messages?.slice(-1)[0]?.status == "pending") {
        current_messages.pop();
      }
      current_messages.push(action.payload);
    },
    updateDirectMessagesSeen(state, action) {
      let messages = state.direct_chat.current_direct_messages;
      let new_messages = messages.map((el) => {
        return { ...el, seen: true };
      });

      state.direct_chat.current_direct_messages = new_messages;
    },
    updateDirectMessageSeenStatus(state, action) {
      let messages = state.direct_chat.current_direct_messages;
      let new_messages = messages.map((el) => {
        if (el?.id == action.payload?.messageId) {
          return { ...el, seen: true };
        }
        return el;
      });

      state.direct_chat.current_direct_messages = new_messages;
    },
    updateExistingDirectMessage(state, action) {
      let messages = state.direct_chat.current_direct_messages;
      let new_messages = messages.map((el) => {
        if (el?.id == action.payload?.id) {
          return { ...el, status: "sent" };
        }
        return el;
      });

      state.direct_chat.current_direct_messages = new_messages;
    },
    updateExistingGroupMessage(state, action) {
      let messages = state.group_chat.current_group_messages;
      let new_messages = messages.map((el) => {
        if (el?.id == action.payload?.id) {
          return { ...el, status: "sent" };
        }
        return el;
      });

      state.group_chat.current_group_messages = new_messages;
    },

    addGroupMessage(state, action) {
      const current_messages = state.group_chat.current_group_messages;

      if (current_messages?.slice(-1)[0]?.status == "pending") {
        current_messages.pop();
      }
      current_messages.push(action.payload);
    },
    ResetDirectChat(state) {
      state.direct_chat.current_direct_conversation = null;
      state.direct_chat.current_direct_messages = [];
    },
    ResetGroupChat(state) {
      state.group_chat.current_group_conversation = null;
      state.group_chat.current_group_messages = [];
    },
    setfullImagePreview(state, action) {
      state.fullImagePreview = action.payload.fullviewImg;
    },
  },
});

export const {
  fetchDirectConversations,
  fetchGroupConversations,
  updateDirectConversation,
  updateGroupConversation,
  addDirectConversation,
  addGroupConversation,
  fetchCurrentDirectMessages,
  fetchCurrentGroupMessages,
  setCurrentDirectConversation,
  setCurrentGroupConversation,
  addDirectMessage,
  addGroupMessage,
  ResetDirectChat,
  ResetGroupChat,
  setfullImagePreview,
  updateDirectMessagesSeen,
  updateDirectMessageSeenStatus,
  updateExistingDirectMessage,
  updateExistingGroupMessage,
  setCurrentDirectMessages,
  setCurrentGroupMessages,
} = slice.actions;

export default slice.reducer;
