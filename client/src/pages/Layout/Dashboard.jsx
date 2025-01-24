import React, { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useSelector, useDispatch } from "react-redux";
import { connectSocket, socket } from "../../socket.js";
import ToastConfig from "../../toastConfig/ToastConfig.jsx";
import { CiLogout } from "react-icons/ci";
import { CgProfile } from "react-icons/cg";
import toast from "react-hot-toast";
import {
  useExistingDirectConversationsQuery,
  useFriendsQuery,
  useGetConversationMutation,
  useLazySuccessQuery,
  useLogoutMutation,
} from "../../store/slices/apiSlice.js";
import { setChatType, updateFriends } from "../../store/slices/appSlice.js";
import {
  addDirectConversation,
  addDirectMessage,
  addGroupConversation,
  addGroupMessage,
  updateDirectConversation,
  updateDirectMessagesSeen,
  updateExistingDirectMessage,
  updateGroupConversation,
  updateDirectMessageSeenStatus,
  updateExistingGroupMessage,
  fetchDirectConversations,
} from "../../store/slices/conversation.js";
import { motion, AnimatePresence } from "motion/react";
import Loader from "../../components/Loader/Loader.jsx";
import { Navigates } from "../../data/data.jsx";
import { UpdateAuthState } from "../../store/slices/authSlice.js";
import { RxEnterFullScreen, RxExitFullScreen } from "react-icons/rx";
const RootPageLayout = () => {
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [openuserDialog, setOpenuserDialog] = useState(false);
  const [fullscreenisactive, SetFullScreenIsActive] = useState(false);
  const dispatch = useDispatch();
  const Navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useSelector((state) => state.auth.user);

  const [
    triggerLoginUser,
    { data: LoginUserData, isSuccess: LoginUserIsSuccess },
  ] = useLazySuccessQuery();

  useEffect(() => {
    triggerLoginUser({});
  }, []);
  useEffect(() => {
    if (LoginUserIsSuccess && LoginUserData) {
      dispatch(UpdateAuthState(LoginUserData.user));
      toast.success(LoginUserData.message);
      toast.success("Login success");

      // Navigate("/");
    }
  }, [LoginUserIsSuccess, LoginUserData]);

  // useEffect(() => {
  //   if (!user) {
  //     Navigate("/login");
  //   }else{
  //     Navigate("/")
  //   }
  // }, [user]);

  const { direct_chat, group_chat } = useSelector(
    (state) => state.conversation
  );
  const { friends, chat_type, room_id } = useSelector((state) => state.app);

  const [getConversation, { data: getConversationData }] =
    useGetConversationMutation();

  const [logout, { data: logoutData, error: logoutError }] =
    useLogoutMutation();

  const { data: friendsData, error: friendsError } = useFriendsQuery();

  const CurrentIndex = Navigates.findIndex((el) => el.navigate === pathname);
  const [activeIndex, setActiveIndex] = useState(CurrentIndex || 0);
  useEffect(() => {
    const CurrentIndex = Navigates.findIndex((el) => el.navigate === pathname);
    setActiveIndex(CurrentIndex);
    switch (pathname) {
      case "/":
        dispatch(setChatType("individual"));
        break;
      case "/group":
        dispatch(setChatType("group"));

        break;
    }
  }, [pathname]);

  const {
    data: DirectConversationData,
    isLoading,
    error: DirectConversationError,
  } = useExistingDirectConversationsQuery();
  // Hook for updating DirectConversations to the store
  useEffect(() => {
    if (DirectConversationData) {
      dispatch(
        fetchDirectConversations({
          conversations: DirectConversationData.data,
          auth: user,
        })
      );
    } else if (DirectConversationError) {
      console.log(DirectConversationError);
    }
  }, [DirectConversationData, DirectConversationError]);

  // update friends data to store
  useEffect(() => {
    if (friendsData && friendsData.data) {
      dispatch(updateFriends(friendsData.data));
    } else if (friendsError) {
      console.log("failed to fetch friends");
    }
  }, [friendsData, friendsError]);

  // update single conversation to the store
  useEffect(() => {
    if (getConversationData) {
      switch (getConversationData.data.messages[0]?.conversationType) {
        case "OneToOneMessage":
          console.log(getConversationData.data);
          dispatch(
            addDirectConversation({
              auth: user,
              conversation: getConversationData.data,
            })
          );
          break;
        case "OneToManyMessage":
          dispatch(
            addGroupConversation({
              conversation: getConversationData.data,
              auth: user,
            })
          );
          break;
        default:
          console.log("getConversationData is null", getConversationData);
          break;
      }
    }
  }, [getConversationData]);

  // Hook for initiating a socket connection with server after user login
  useEffect(() => {
    if (user?._id) {
      // Connect to the socket and set up event listeners
      connectSocket(user?._id)
        .then(() => {
          setIsSocketConnected(true);
        })
        .catch((error) => {
          console.error("Socket connection error:", error);
          setIsSocketConnected(false);
        });

      // Set up socket event listeners
      const handleNewFriendRequest = (data) => toast.success(data.message);
      const handleRequestAccepted = (data) => toast.success(data.message);
      const handleRequestSent = (data) => toast.success(data.message);

      socket.on("new_friendrequest", handleNewFriendRequest);
      socket.on("friendrequest_accepted", handleRequestAccepted);
      socket.on("friendrequest_sent", handleRequestSent);

      // Clean up socket event listeners on component unmount
      return () => {
        socket?.off("new_friendrequest");
        socket?.off("friendrequest_accepted");
        socket?.off("friendrequest_sent");
      };
    }
  }, [user?._id]);

  // Socket events

  // Hook for getting new_messages
  useEffect(() => {
    if (isSocketConnected) {
      const handleNewMsg = (message) => {
        switch (message?.conversationType) {
          case "OneToOneMessage":
            switch (message?.conversationId.toString()) {
              case direct_chat.current_direct_conversation?.id.toString():
                socket.emit("msg_seen_byreciever", {
                  messageId: message?._id,
                  conversationType: message?.conversationType,
                  conversationId: message?.conversationId,
                  sender: message?.sender,
                });
                dispatch(
                  addDirectMessage({
                    id: message?._id,
                    type: message?.messageType,
                    message: message?.message,
                    createdAt: message?.createdAt,
                    updatedAt: message?.updatedAt,
                    incoming: message?.recipients === user?._id,
                    outgoing: message?.sender === user?._id,
                    status: "sent",
                    seen: true,
                  })
                );

                break;
              default:
                socket.emit("update_unreadMsgs", message);
                break;
            }
            break;
          case "OneToManyMessage":
            switch (message?.conversationId.toString()) {
              case group_chat.current_group_conversation?.id.toString():
                dispatch(
                  addGroupMessage({
                    id: message?._id,
                    type: message?.messageType,
                    message: message?.message,
                    conversationId: message?.conversationId,
                    createdAt: message?.createdAt,
                    updatedAt: message?.updatedAt,
                    incoming: message?.recipients.includes(user?._id),
                    outgoing: message?.sender === user?._id,
                    from: message?.sender,
                    status: "sent",
                  })
                );
                break;
              default:
                socket.emit("update_unreadMsgs", message);
                break;
            }
            break;
          default:
            console.log("Unknown chat type");
            break;
        }
      };

      const handleUpdateMsgStatus = (message) => {
        switch (message?.conversationType) {
          case "OneToOneMessage":
            switch (message?.conversationId.toString()) {
              case direct_chat.current_direct_conversation?.id.toString():
                dispatch(
                  updateExistingDirectMessage({
                    id: message?.messageId,
                  })
                );
                break;
              default:
                break;
            }
            break;
          case "OneToManyMessage":
            switch (message?.conversationId.toString()) {
              case group_chat.current_group_conversation?.id.toString():
                dispatch(
                  updateExistingGroupMessage({ id: message?.messageId })
                );
                break;
              default:
                break;
            }
            break;
          default:
            console.log("Unknown chat type");
            break;
        }
      };

      const handleUpdateMsgSeen = (data) => {
        dispatch(updateDirectMessageSeenStatus(data));
      };

      const handleUpdateAllMsgSeenTrue = (conversationId) => {
        const conversation = direct_chat.DirectConversations.filter(
          (conv) => conv.id == conversationId
        );
        dispatch(
          updateDirectConversation({
            ...conversation[0],
            seen: true,
          })
        );
        dispatch(updateDirectMessagesSeen());
      };

      socket.on("new_message", handleNewMsg);
      socket.on("update_msg_status", handleUpdateMsgStatus);
      socket.on("update_msg_seen", handleUpdateMsgSeen);
      socket.on("all_msg_seen", handleUpdateAllMsgSeenTrue);

      return () => {
        socket.off("new_message", handleNewMsg);
        socket.off("update_msg_status", handleUpdateMsgStatus);
      };
    }
  }, [
    isSocketConnected,
    direct_chat.DirectConversations,
    direct_chat.current_direct_conversation,
    group_chat.current_group_conversation,
  ]);

  // Hook for getting unread_messages
  useEffect(() => {
    if (isSocketConnected) {
      const handleUnreadMsgs = async (message) => {
        switch (message?.conversationType) {
          case "OneToOneMessage":
            const [update_Direct_Conversation] =
              direct_chat.DirectConversations.filter(
                (el) => el.id == message?.conversationId
              );
            if (update_Direct_Conversation) {
              dispatch(
                updateDirectConversation({
                  ...update_Direct_Conversation,
                  msg: {
                    type: message?.messageType,
                    message: message?.message,
                    createdAt: message?.createdAt,
                  },
                  outgoing: message?.sender === user?._id,
                  time: message?.createdAt,
                  unread: (update_Direct_Conversation?.unread || 0) + 1,
                })
              );
            } else {
              await getConversation({
                conversationId: message?.conversationId,
                conversationType: message?.conversationType,
              });
            }
            break;
          case "OneToManyMessage":
            const [update_Group_Conversation] =
              group_chat.GroupConversations.filter(
                (el) => el.id == message?.conversationId
              );
            if (update_Group_Conversation) {
              dispatch(
                updateGroupConversation({
                  ...update_Group_Conversation,
                  outgoing: message?.sender === user?._id,
                  msg: {
                    type: message?.messageType,
                    message: message?.message,
                    createdAt: message?.createdAt,
                  },
                  from: message?.sender,
                  time: message?.createdAt,
                  unread: (update_Group_Conversation?.unread || 0) + 1,
                })
              );
            } else {
              await getConversation({
                conversationId: message?.conversationId,
                conversationType: message?.conversationType,
              });
            }
            break;
          default:
            console.log("Invalid chat_type at on_update_unreadMsg");
            break;
        }
      };
      socket?.on("on_update_unreadMsg", handleUnreadMsgs);
      return () => {
        socket?.off("on_update_unreadMsg", handleUnreadMsgs);
      };
    }
  }, [
    isSocketConnected,
    direct_chat.DirectConversations,
    group_chat.GroupConversations,
    direct_chat.current_direct_conversation,
    group_chat.current_group_conversation,
    user?._id,
  ]);

  // Hook for updating online/offline status of user(friends)
  useEffect(() => {
    if (isSocketConnected) {
      const handleUpdateStatus = (data) => {
        const { id, status } = data;
        const [updateConversation] = direct_chat.DirectConversations.filter(
          (el) => el?.user_id == id
        );
        dispatch(
          updateDirectConversation({
            ...updateConversation,
            online: status === "Online",
          })
        );
      };
      socket.on("user_status_update", handleUpdateStatus);
      return () => {
        socket.off("user_status_update", handleUpdateStatus);
      };
    }
  }, [isSocketConnected, direct_chat.DirectConversations]);

  // emiting the event to mark the user as offline  before closing of tab
  useEffect(() => {
    if (friends) {
      const handleChangeStatus = () => {
        socket.emit("exit", { user_id: user?._id, friends });
        // socket.disconnect();
      };
      window.addEventListener("beforeunload", handleChangeStatus);

      return () => {
        window.removeEventListener("beforeunload", handleChangeStatus);
      };
    }
  }, [friends]);

  //Hook for logout
  useEffect(() => {
    if (logoutData) {
      socket.emit("exit", { user_id: user?._id, friends });
      localStorage.removeItem("auth_id");
      Navigate("/login");
    } else if (logoutError) {
      toast.error("Failed to logout");
    }
  }, [logoutData, logoutError]);

  // handler functions

  const handleChangeactiveIndex = useCallback(
    (index) => {
      setActiveIndex(index);
    },
    [activeIndex]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    handletoggleopenDialog();
  }, []);

  const handleUserAction = useCallback((text) => {
    switch (text) {
      case "profile":
        Navigate("/profile");
        handletoggleopenDialog();
        break;
      case "logout":
        handleLogout();
        break;
    }
  }, []);

  const handletoggleopenDialog = useCallback(() => {
    setOpenuserDialog((prev) => !prev);
  }, []);

  function toggleFullscreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullscreen =
      docEl.requestFullscreen ||
      docEl.mozRequestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.msRequestFullscreen;
    const exitFullscreen =
      doc.exitFullscreen ||
      doc.mozCancelFullscreen ||
      doc.webkitExitFullscreen ||
      doc.msExitFullscreen;

    if (!doc.fullscreenElement) {
      requestFullscreen.call(docEl);
      SetFullScreenIsActive(true);
    } else {
      exitFullscreen.call(doc);
      SetFullScreenIsActive(false);
    }
  }

  return (
    <>
      {!isSocketConnected ? (
        <Loader />
      ) : (
        <div className="Layout">
          <ToastConfig />
          {/* sidebar */}
          <nav className={`navbar ${room_id ? "Disable" : ""}`}>
            <div className="enter_exit_fullscreen" onClick={toggleFullscreen}>
              {fullscreenisactive ? (
                <RxExitFullScreen />
              ) : (
                <RxEnterFullScreen />
              )}
            </div>
            <ul className="topfield">
              {Navigates.map(({ icon, active_icon, navigate, name }, index) => (
                <Link
                  to={navigate}
                  key={index}
                  className={`navigate ${activeIndex == index ? "active" : ""}`}
                >
                  <li onClick={() => handleChangeactiveIndex(index)}>
                    {activeIndex === index ? active_icon : icon}
                    {/* {icon} */}
                    {/* <p className="navigate_name">{name}</p> */}
                  </li>
                </Link>
              ))}
            </ul>
            <div className="profile">
              <img src={user.avatar} alt="" onClick={handletoggleopenDialog} />
              <AnimatePresence>
                {openuserDialog && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.1 }}
                    className="userDialog"
                  >
                    {[
                      { text: "profile", icon: <CgProfile /> },
                      { text: "logout", icon: <CiLogout /> },
                    ].map((el, i) => {
                      return (
                        <div
                          className="user_el"
                          key={i}
                          onClick={() => handleUserAction(el.text)}
                        >
                          {el.icon}
                          <p>{el.text}</p>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
          <Outlet />
        </div>
      )}
    </>
  );
};

export default RootPageLayout;
