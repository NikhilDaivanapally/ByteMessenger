import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../socket";
import { ResetChatRoomId, toggleSideBar } from "../../store/slices/appSlice";
import { RiArrowLeftSLine } from "react-icons/ri";
import {
  ResetDirectChat,
  ResetGroupChat,
} from "../../store/slices/conversation";
import { GrGroup } from "react-icons/gr";

const Header = () => {
  const dispatch = useDispatch();
  const [istyping, setIstyping] = useState("");

  const { room_id, chat_type } = useSelector((state) => state.app);
  const { _id: auth_id } = useSelector((state) => state.auth.user);
  const { current_direct_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const { current_group_conversation } = useSelector(
    (state) => state.conversation.group_chat
  );

  // receive the event when typing start and stop
  useEffect(() => {
    socket.on("Is_Typing", (data) => {
      const { userName, room_id } = data;
      setIstyping(userName);
    });
    socket.on("Is_Stop_Typing", () => {
      setIstyping("");
    });

    return () => {
      socket.off("Is_Typing");
      socket.off("Is_Stop_Typing");
    };
  }, []);

  const handleToggleContactsideBar = () => {
    dispatch(toggleSideBar());
  };
  const handleGobackToConversation = () => {
    dispatch(ResetChatRoomId());
    if (chat_type == "individual") {
      dispatch(ResetDirectChat());
    } else if (chat_type == "group") {
      dispatch(ResetGroupChat());
    }
  };
  return (
    <div className="header">
      {/* left side */}
      <RiArrowLeftSLine
        className="go_back"
        onClick={handleGobackToConversation}
      />
      <div className="Profile" onClick={handleToggleContactsideBar}>
        <div className="profile_container">
          {chat_type === "individual" && (
            <img
              className="profile"
              src={current_direct_conversation?.avatar}
            />
          )}
          {chat_type === "group" &&
            (current_group_conversation?.img ? (
              <img className="profile" src={current_group_conversation?.img} />
            ) : (
              <GrGroup className="no_groupimg" />
            ))}

          {current_direct_conversation?.online && (
            <div className="online_offline"></div>
          )}
        </div>
        <div className="profile-info">
          <p className="profile_name">
            {chat_type === "individual"
              ? current_direct_conversation?.name
              : current_group_conversation?.title}
          </p>
          <p className="profile_status">
            {chat_type == "individual" ? (
              <>
                {istyping
                  ? "Typing..."
                  : current_direct_conversation?.online
                  ? "Online"
                  : "Offline"}
              </>
            ) : (
              <>
                {istyping ? (
                  <>{istyping} is Typing</>
                ) : (
                  <>
                    {current_group_conversation?.users.length > 0 && (
                      <>
                        {[
                          ...current_group_conversation?.users,
                          current_group_conversation?.admin,
                        ].map((el, i) => {
                          return (
                            <span key={i}>
                              {el?._id == auth_id ? "you" : el?.userName}{" "}
                              {i ==
                              [
                                ...current_group_conversation?.users,
                                current_group_conversation?.admin,
                              ].length -
                                1
                                ? ""
                                : " ,"}
                            </span>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;
