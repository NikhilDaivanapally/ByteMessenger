import React from "react";
import "./Dialog.css";
const Dialog = (props) => {
  const {backgroundColor, onClose, children } = props;
  return (
    <div
      className="dialog"
      style={{
        backgroundColor: `${
          backgroundColor ? backgroundColor : "rgba(0,0,0,0.4)"
        }`,
      }}
      onClick={(e) => e.target.classList.contains("dialog") && onClose()}
    >
      <div className="dialog_panel">{children}</div>
    </div>
  );
};

export default Dialog;
