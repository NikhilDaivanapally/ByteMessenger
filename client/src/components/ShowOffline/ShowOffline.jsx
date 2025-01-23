import React from "react";
import { useDispatch } from "react-redux";
import { updateOnlineStatus } from "../../store/slices/appSlice";
import "./ShowOffline.css";
import { MdOutlineWifiOff } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
const ShowOffline = () => {
  const dispatch = useDispatch();
  return (
    <div className="onlinestatus">
      <MdOutlineWifiOff className="status_icon" />
      <div className="status_info">
        <p>Computer is Offline</p>
        <span>Make sure that u have active internet</span>
      </div>
      <RxCross2
        className="close_icon"
        onClick={() => dispatch(updateOnlineStatus({ status: true }))}
      />
    </div>
  );
};

export default ShowOffline;
