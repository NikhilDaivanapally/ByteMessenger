import React from "react";
import "./AuthLoader.css";
const AuthLoader = () => {
  return (
    <svg className="loader" viewBox="20 24 60 70">
      <circle className="spin" r="20" cy="50" cx="50"></circle>
    </svg>
  );
};

export default AuthLoader;
