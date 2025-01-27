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
    fetchUsers(state, action) {
      state.users = action.payload;
    },
    fetchFriends(state, action) {
      state.friends = action.payload;
    },
    fetchFriendRequests(state, action) {
      state.friendRequests = action.payload;
    },
    addFriendRequest(state, action) {
      state.friendRequests = [...state.friendRequests, action.payload];
    },
    addFriend(state, action) {
      console.log(action.payload);
      state.friends = [...state?.friends, action.payload];
    },
    removeUserFromUsers(state, action) {
      console.log(state?.users, action.payload);
      state.users = state.users?.filter(
        (el) => el?._id !== action?.payload?._id
      );
    },
    removeRequestFromFriendRequests(state, action) {
      console.log(state.friendRequests, action.payload);
      state.friendRequests = state.friendRequests?.filter(
        (el) => el?._id !== action?.payload?._id
      );
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
  fetchUsers,
  fetchFriends,
  fetchFriendRequests,
  updateSidebarType,
  ResetChatRoomId,
  updateOnlineStatus,
  updateOpenCamera,
  addFriendRequest,
  removeUserFromUsers,
  removeRequestFromFriendRequests,
  addFriend,
} = Slice.actions;
export default Slice.reducer;
