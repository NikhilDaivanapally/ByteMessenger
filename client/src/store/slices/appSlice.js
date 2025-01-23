import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  sideBar: {
    open: false,
    type: "CONTACT", // can be CONTACT, STARRED, SHARED
  },
  users: [], // all users of app who are not friends and not requested yet
  friends: [], // all friends
  friendRequests: [], // all friend requests
  chat_type: null,
  room_id: null,
  OnlineStatus: null, // online status of the browser
  openCamera: false,
};

const Slice = createSlice({
  name: "app",
  initialState,
  reducers: {
    toggleSideBar(state, action) {
      if (action.payload) {
        state.sideBar.open = action.payload.open;
      } else {
        state.sideBar.open = !state.sideBar.open;
      }
    },
    updateSidebarType(state, action) {
      state.sideBar.type = action.payload.type;
    },
    SelectConversation(state, action) {
      state.room_id = action.payload.room_id;
    },
    ResetChatRoomId(state) {
      state.room_id = null;
    },
    updateUsers(state, action) {
      state.users = action.payload;
    },
    updateFriends(state, action) {
      state.friends = action.payload;
    },
    updateFriendRequests(state, action) {
      state.friendRequests = action.payload;
    },
    updateOnlineStatus(state, action) {
      state.OnlineStatus = action.payload.status;
    },
    updateOpenCamera(state, action) {
      state.openCamera = action.payload;
    },
    setChatType(state, action) {
      state.chat_type = action.payload;
    },
  },
});

export const {
  toggleSideBar,
  SelectConversation,
  setChatType,
  updateUsers,
  updateFriends,
  updateFriendRequests,
  updateSidebarType,
  ResetChatRoomId,
  updateOnlineStatus,
  updateOpenCamera,
} = Slice.actions;
export default Slice.reducer;
