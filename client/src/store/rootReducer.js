import { combineReducers } from "redux";
// import storage from "redux-persist/lib/storage";

// slices
import authReducer from "./slices/authSlice";
import { apiSlice } from "./slices/apiSlice";
import appReducer from "./slices/appSlice";
import conversationReducer from "./slices/conversation";
// const rootPersistConfig = {
//   key: "root",
//   storage,
//   keyPrefix: "redux-",
// };

const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  app: appReducer,
  conversation: conversationReducer,
});

export { rootReducer };
