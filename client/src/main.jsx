import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./store/Store.js";
// import Loader from "./Loader/Loader.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <Suspense
  //   fallback={
  //     <div style={{ width: "100%", height: "100vh" }}>
  //       <Loader />
  //     </div>
  //   }
  // >
  <Provider store={store}>
    <App />
  </Provider>
  //  </Suspense>
);
