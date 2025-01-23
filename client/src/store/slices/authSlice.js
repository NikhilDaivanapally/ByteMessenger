import { createSlice } from "@reduxjs/toolkit";

const slice = createSlice({
  name: "authState",
  initialState: {
    user: null,
  },
  reducers: {
    UpdateAuthState(state, action) {
      state.user = action.payload;
    },
  },
});
export const { UpdateAuthState } = slice.actions;

export default slice.reducer;
