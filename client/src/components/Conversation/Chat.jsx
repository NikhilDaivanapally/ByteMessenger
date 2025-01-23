import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AudioMsg,
  DocMsg,
  LinkMsg,
  MediaMsg,
  ReplyMsg,
  TextMsg,
  Timeline,
} from "./Msgtype";
import { socket } from "../../socket";
import {
  addDirectMessage,
  addGroupMessage,
  fetchCurrentDirectMessages,
  fetchCurrentGroupMessages,
  setCurrentDirectConversation,
  setCurrentGroupConversation,
  setfullImagePreview,
} from "../../store/slices/conversation";
import NoChat from "./NoChat/NoChat";
import Header from "./Header";
import Footer from "./Footer";
import "./Chat.css";
import { BsEmojiSmile } from "react-icons/bs";
import { RxCross2 } from "react-icons/rx";
import { LuSendHorizonal } from "react-icons/lu";
import { LuPlus } from "react-icons/lu";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import SortMessages from "../../utils/SortMessages";
import { updateOpenCamera } from "../../store/slices/appSlice";
import Loader from "../Loader/Loader";
const Chat = () => {
  const dispatch = useDispatch();
  const CameraRef = useRef(null);
  const canvasRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [blob, setBlob] = useState(null);
  const [isloading, setIsloading] = useState(false);
  const [isNonTextmsg, setIsNonTextmsg] = useState(null);
  const [previewURLs, setPreviewURLs] = useState(null);
  const [mainPreview, setMainprev] = useState(null);
  const [textmsg, setTextmsg] = useState("");
  const messagesListRef = useRef(null);
  const { room_id, chat_type, openCamera } = useSelector((state) => state.app);
  const { fullImagePreview } = useSelector((state) => state.conversation);
  const user = useSelector((state) => state.auth.user);
  const currentImgRef = useRef(null);
  const {
    DirectConversations,
    current_direct_messages,
    current_direct_conversation,
  } = useSelector((state) => state.conversation.direct_chat);
  const {
    GroupConversations,
    current_group_messages,
    current_group_conversation,
  } = useSelector((state) => state.conversation.group_chat);
  const {
    _id: auth_id,
    userName,
    avatar,
  } = useSelector((state) => state.auth.user);

  let userList = [];

  if (
    current_group_conversation?.users.length > 0 &&
    current_group_conversation?.admin
  ) {
    userList = [
      ...current_group_conversation?.users,
      current_group_conversation?.admin,
    ]
      .filter((el) => el._id !== auth_id)
      .map((el) => el._id);
  }

  useEffect(() => {
    if (currentImgRef.current) {
      currentImgRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [fullImagePreview]);

  let MediaImgs = [];

  if (chat_type == "individual") {
    MediaImgs = current_direct_messages?.filter((el) => el.type == "photo");
  } else {
    MediaImgs = current_group_messages?.filter((el) => el.type == "photo");
  }

  // Scroll to the bottom when messages change
  const scrollToBottomSmooth = () => {
    if (messagesListRef.current) {
      messagesListRef?.current?.scrollTo({
        top: messagesListRef.current.scrollHeight,
        behavior: "smooth",
      });
      // messagesListRef?.current?.scrollIntoView({ behavior: "smooth" });
      // messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  };

  // Scroll to the bottom when messages change
  const scrollToBottomQuick = () => {
    if (messagesListRef?.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Using setTimeout to ensure scroll happens after DOM update
    setTimeout(scrollToBottomQuick, 100);
  }, [current_direct_messages, current_group_messages, room_id, isNonTextmsg]);

  // get the messages for current room_id and set it has current_direct_conversation
  useEffect(() => {
    switch (true) {
      case room_id !== null:
        switch (chat_type) {
          case "individual":
            setIsloading(true);
            const currentDirectChat = DirectConversations.find(
              (el) => el?.id === room_id
            );
            if (currentDirectChat) {
              socket.emit(
                "get_messages",
                { conversation_id: currentDirectChat?.id },
                (data) => {
                  dispatch(
                    fetchCurrentDirectMessages({ auth: user, messages: data })
                  );
                  setIsloading(false);
                }
              );
              dispatch(setCurrentDirectConversation(currentDirectChat));
            } else {
              setIsloading(false);
            }
            break;
          case "group":
            setIsloading(true);
            const currentGroupChat = GroupConversations.find(
              (el) => el?.id === room_id
            );
            socket.emit(
              "get_messages",
              { conversation_id: currentGroupChat?.id },
              (data) => {
                dispatch(
                  fetchCurrentGroupMessages({ auth: user, messages: data })
                );
                setIsloading(false);
              }
            );
            dispatch(setCurrentGroupConversation(currentGroupChat));
            break;
          default:
            console.log("Invalid Chat_type");
            break;
        }
        break;

      default:
        // console.log("room_id is undefined || null");
        break;
    }
  }, [room_id]);

  useEffect(() => {
    if (isNonTextmsg) {
      const PreviewURL = isNonTextmsg.map((media) => {
        const reader = new FileReader(); // Create a new FileReader instance for each media file
        reader.readAsDataURL(media);

        return new Promise((resolve) => {
          reader.onload = (e) => {
            const blob = e.target.result;
            resolve({
              name: media.name,
              size: media.size,
              url: URL.createObjectURL(media),
              blob,
            });
          };
        });
      });

      // Wait for all promises to resolve
      Promise.all(PreviewURL).then((previewURLs) => {
        setPreviewURLs(previewURLs);
        setMainprev(previewURLs.slice(-1)[0]);

        return () => {
          // Later, when the URLs are no longer needed, revoke them
          previewURLs.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
      });
    }
  }, [isNonTextmsg]);

  const handleClosesendMedia = () => {
    setIsNonTextmsg(null);
    setPreviewURLs(null);
  };

  const handleSendPhotoMsg = () => {
    const messageId = crypto.randomUUID();
    const messageCreatedAt = new Date().toISOString();

    chat_type === "individual"
      ? dispatch(
          addDirectMessage({
            id: messageId,
            type: "photo",
            message: {
              photoUrl: previewURLs?.slice(-1)[0].url,
              description: textmsg,
            },
            createdAt: messageCreatedAt,
            updatedAt: messageCreatedAt,
            incoming: false,
            outgoing: true,
            status: "pending",
            seen: false,
          })
        )
      : dispatch(
          addGroupMessage({
            id: messageId,
            type: "photo",
            message: {
              photoUrl: previewURLs?.slice(-1)[0].url,
              description: textmsg,
            },
            conversationId: room_id,
            createdAt: messageCreatedAt,
            updatedAt: messageCreatedAt,
            incoming: false,
            outgoing: true,
            status: "pending",
            seen: false,
          })
        );

    const to =
      chat_type === "individual"
        ? current_direct_conversation.user_id
        : userList;

    socket.emit("media_message", {
      _id: messageId,
      sender: auth_id,
      recipients: to,
      messageType: "photo",
      message: {
        file: previewURLs,
        text: textmsg,
      },
      conversationType:
        chat_type == "individual" ? "OneToOneMessage" : "OneToManyMessage",
      conversationId: room_id,
      createdAt: messageCreatedAt,
      updatedAt: messageCreatedAt,
    });
    setIsNonTextmsg(null);
    setPreviewURLs(null);
    setTextmsg(null);
  };
  const Current_index = MediaImgs.findIndex(
    (el) => el?.id == fullImagePreview?.id
  );
  const handleChangeImage = (e) => {
    console.log(e);
    switch (true) {
      case e.target.classList.contains("prev") ||
        e.target.parentElement.classList.contains("prev"):
        Current_index > 0 &&
          dispatch(
            setfullImagePreview({ fullviewImg: MediaImgs[Current_index - 1] })
          );
        break;
      case e.target.classList.contains("next") ||
        e.target.parentElement.classList.contains("next"):
        Current_index < MediaImgs.length - 1 &&
          dispatch(
            setfullImagePreview({ fullviewImg: MediaImgs[Current_index + 1] })
          );
        break;
      default:
        break;
    }
  };

  const {
    DatesArray: IndividualMessagesSortedDates,
    MessagesObject: IndividualMessagesObject,
  } = SortMessages({
    messages: current_direct_messages,
    sort: "Asc",
  });

  const {
    DatesArray: GroupMessagesSortedDates,
    MessagesObject: GroupMessagesObject,
  } = SortMessages({
    messages: current_group_messages,
    sort: "Asc",
  });

  const handleCloseCamera = () => {
    const stream = CameraRef.current?.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop()); // Stop all tracks
    }
    photo && setPhoto(null);
    blob && setBlob(null);
    dispatch(updateOpenCamera(false));
  };

  const handleStreamOpenCameraData = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (CameraRef.current) {
        CameraRef.current.srcObject = stream;
      }
    } catch (error) {
      console.log("Error while accessing Camera", error);
    }
  }, [openCamera]);

  const handleTakepicture = () => {
    if (CameraRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const video = CameraRef.current;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas content into a Blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a Blob URL
          const blobUrl = URL.createObjectURL(blob);
          setPhoto(blobUrl); // Store the Blob URL in the state
        }
      }, "image/png");
      const stream = CameraRef.current?.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop()); // Stop all tracks
      }
    }
  };

  useEffect(() => {
    if (openCamera && CameraRef.current) {
      handleStreamOpenCameraData();
      console.log("Camera open");
    }
  }, [openCamera]);

  useEffect(() => {
    if (photo) {
      (async () => {
        const blob = await fetch(photo).then((res) => res.blob());
        setBlob(blob);
      })();
    }
  }, [photo]);

  const handleSend_Clicked_Picture = () => {
    const messageId = crypto.randomUUID();
    const messageCreatedAt = new Date().toISOString();
    chat_type === "individual"
      ? dispatch(
          addDirectMessage({
            id: messageId,
            type: "photo",
            message: {
              photoUrl: photo,
              description: textmsg,
            },
            createdAt: messageCreatedAt,
            updatedAt: messageCreatedAt,
            incoming: false,
            outgoing: true,
            status: "pending",
            seen: false,
          })
        )
      : dispatch(
          addGroupMessage({
            id: messageId,
            type: "photo",
            message: {
              photoUrl: photo,
              description: textmsg,
            },
            conversationId: room_id,
            createdAt: messageCreatedAt,
            updatedAt: messageCreatedAt,
            incoming: false,
            outgoing: true,
            status: "pending",
            seen: false,
          })
        );

    const to =
      chat_type === "individual"
        ? current_direct_conversation.user_id
        : userList;

    socket.emit("upload_camera_picture", {
      _id: messageId,
      sender: auth_id,
      recipients: to,
      messageType: "photo",
      message: {
        file: blob,
        text: textmsg,
      },
      conversationType:
        chat_type == "individual" ? "OneToOneMessage" : "OneToManyMessage",
      conversationId: room_id,
      createdAt: messageCreatedAt,
      updatedAt: messageCreatedAt,
    });

    handleCloseCamera();
  };

  return (
    <div
      className={`Conversation_diplay ${
        current_direct_conversation || current_group_conversation
          ? ""
          : "disableChat_display"
      }`}
    >
      {room_id !== null ? (
        <>
          {!isloading ? (
            <div className="Selected_Conversation">
              {/* header */}
              <Header />
              {!openCamera ? (
                <>
                  {!isNonTextmsg && !previewURLs ? (
                    <>
                      <div className="body" ref={messagesListRef}>
                        {chat_type === "individual" ? (
                          <>
                            {IndividualMessagesSortedDates.map((date, i) => (
                              <div
                                key={`${date}_Msgs`}
                                className="datewise_msgs"
                              >
                                {/* Date */}
                                <Timeline date={date} />
                                {/* messages */}
                                {IndividualMessagesObject[date].map(
                                  (el, index) => {
                                    switch (el.type) {
                                      case "photo":
                                        return (
                                          <MediaMsg
                                            el={el}
                                            key={index}
                                            scrollToBottom={
                                              scrollToBottomSmooth
                                            }
                                          />
                                        );
                                      case "doc":
                                        return <DocMsg el={el} key={index} />;
                                      case "link":
                                        return <LinkMsg el={el} key={index} />;
                                      case "reply":
                                        return <ReplyMsg el={el} key={index} />;
                                      case "audio":
                                        return <AudioMsg el={el} key={index} />;
                                      default:
                                        return <TextMsg el={el} key={index} />;
                                    }
                                  }
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            {GroupMessagesSortedDates.map((date, i) => (
                              <div
                                key={`${date}_Msgs`}
                                className="datewise_msgs"
                              >
                                {/* Date */}
                                <Timeline date={date} />
                                {/* messages */}
                                {GroupMessagesObject[date].map((el, index) => {
                                  switch (el.type) {
                                    case "photo":
                                      return (
                                        <MediaMsg
                                          el={el}
                                          key={index}
                                          scrollToBottom={scrollToBottomSmooth}
                                        />
                                      );
                                    case "doc":
                                      return <DocMsg el={el} key={index} />;
                                    case "link":
                                      return <LinkMsg el={el} key={index} />;
                                    case "reply":
                                      return <ReplyMsg el={el} key={index} />;
                                    case "audio":
                                      return <AudioMsg el={el} key={index} />;
                                    default:
                                      return <TextMsg el={el} key={index} />;
                                  }
                                })}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      {fullImagePreview && (
                        <div className="Imagefull_viewPage">
                          {/* <Header /> */}

                          <div className="viewPage_header">
                            <div className="Profile" onClick={() => {}}>
                              <div className="profile_container">
                                <img
                                  className="profile"
                                  src={
                                    chat_type === "individual"
                                      ? fullImagePreview?.outgoing
                                        ? avatar
                                        : current_direct_conversation?.avatar
                                      : current_group_conversation?.img
                                  }
                                  alt=""
                                />
                                {current_direct_conversation?.online && (
                                  <span className="online_offline"></span>
                                )}
                              </div>
                              <div className="profile-info">
                                <p className="profile_name">
                                  {chat_type === "individual"
                                    ? fullImagePreview?.outgoing
                                      ? "you"
                                      : current_direct_conversation?.name
                                    : fullImagePreview?.outgoing
                                    ? "you"
                                    : current_group_conversation?.title}
                                </p>
                                <p className="profile_status">
                                  {new Date(
                                    fullImagePreview?.createdAt
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    fullImagePreview?.createdAt
                                  ).toLocaleString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true, // Use 12-hour clock and show AM/PM
                                  })}
                                </p>
                              </div>
                            </div>
                            <div
                              className="close_Imagefull_viewPage"
                              onClick={() =>
                                dispatch(
                                  setfullImagePreview({ fullviewImg: null })
                                )
                              }
                            >
                              <RxCross2 />
                            </div>
                          </div>
                          <div className="fullImageView">
                            {/*Image carousel */}
                            <div
                              className="carousel"
                              onClick={handleChangeImage}
                            >
                              <img
                                src={fullImagePreview.message.photoUrl}
                                alt=""
                              />
                              {}{" "}
                              <IoIosArrowBack
                                className={`img_control dia prev ${
                                  Current_index == 0 && "disable"
                                }`}
                              />
                              {}
                              <IoIosArrowForward
                                className={`img_control next ${
                                  Current_index == MediaImgs.length - 1 &&
                                  "disable"
                                }`}
                              />
                            </div>
                            {/* list imagesPreview */}
                            <div className="images_list_container">
                              <ul className="images_list">
                                {MediaImgs.map((el, i) => {
                                  return (
                                    <li
                                      key={i}
                                      className={`${
                                        fullImagePreview.id == el.id
                                          ? "selected"
                                          : ""
                                      }`}
                                      ref={
                                        fullImagePreview.id == el.id
                                          ? currentImgRef
                                          : null
                                      }
                                      onClick={() =>
                                        dispatch(
                                          setfullImagePreview({
                                            fullviewImg: el,
                                          })
                                        )
                                      }
                                    >
                                      <img
                                        src={el.message.photoUrl}
                                        alt=""
                                        style={{ userSelect: "none" }}
                                      />
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* footer */}
                      <Footer
                        setIsNonTextmsg={setIsNonTextmsg}
                        isNonTextmsg={isNonTextmsg}
                      />
                    </>
                  ) : (
                    <div className="body Preview_Send_Media">
                      <div className="Preview_Container">
                        <RxCross2
                          className="close_sendMedia"
                          onClick={handleClosesendMedia}
                        />
                        <img src={mainPreview?.url} alt="" />
                        <div className="preview_info">
                          <span>FileName : {mainPreview?.name}</span>
                          <span>
                            Size : {Math.round(mainPreview?.size / 1024)}
                            kb
                          </span>
                        </div>
                      </div>
                      <div className="Preview_Description">
                        <input
                          type="text"
                          value={textmsg}
                          placeholder="Add Description"
                          onChange={(e) => setTextmsg(e.target.value)}
                        />
                        <BsEmojiSmile className="emoji" />
                      </div>
                      <div className="send_media">
                        <ul className="selected_media">
                          {previewURLs?.map((media, i) => {
                            return (
                              <li key={i} onClick={() => setMainprev(media)}>
                                <img src={media.url} alt="" />
                              </li>
                            );
                          })}
                          <label className="Add_media">
                            <input
                              type="file"
                              hidden
                              onChange={(e) =>
                                setIsNonTextmsg([
                                  ...isNonTextmsg,
                                  ...Object.values(e.target.files),
                                ])
                              }
                            />
                            <LuPlus />
                          </label>
                        </ul>
                        <div className="btn" onClick={handleSendPhotoMsg}>
                          <LuSendHorizonal />
                          {previewURLs?.length > 0 && (
                            <div className="count">{previewURLs?.length}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="openCamera">
                  <header className="openCamera_header">
                    <div>Take a Picture</div>
                    <RxCross2 className="close" onClick={handleCloseCamera} />
                  </header>
                  <div className="Stream_picture">
                    {photo ? (
                      <div className="body Preview_Send_Media">
                        <div className="Preview_Container">
                          <RxCross2
                            className="close_sendMedia"
                            onClick={handleCloseCamera}
                          />
                          <img src={photo} alt="" className="clicked_picture" />
                          <div className="preview_info">
                            {/* <span>FileName : {mainPreview?.name}</span> */}
                            <span>
                              Size : {Math.round(blob?.size / 1024)}
                              kb
                            </span>
                          </div>
                        </div>
                        <div className="Preview_Description">
                          <input
                            type="text"
                            value={textmsg}
                            placeholder="Add Description"
                            onChange={(e) => setTextmsg(e.target.value)}
                          />
                          <BsEmojiSmile className="emoji" />
                        </div>
                        <div className="send_media">
                          {/* <ul className="selected_media">
                            {previewURLs?.map((media, i) => {
                              return (
                                <li key={i} onClick={() => setMainprev(media)}>
                                  <img src={media.url} alt="" />
                                </li>
                              );
                            })}
                            <label className="Add_media">
                              <input
                                type="file"
                                hidden
                                onChange={(e) =>
                                  setIsNonTextmsg([
                                    ...isNonTextmsg,
                                    ...Object.values(e.target.files),
                                  ])
                                }
                              />
                              <LuPlus />
                            </label>
                          </ul> */}
                          <div
                            className="btn"
                            style={{ marginLeft: "auto" }}
                            onClick={handleSend_Clicked_Picture}
                          >
                            <LuSendHorizonal />
                            {/* {previewURLs?.length > 0 && ( */}
                            <div className="count">1</div>
                            {/* )} */}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // <img src={photo} className="clicked_picture" />
                      <>
                        <video
                          ref={CameraRef}
                          className="picture"
                          src=""
                          autoPlay
                        ></video>
                        <canvas
                          ref={canvasRef}
                          style={{ display: "none" }}
                        ></canvas>
                        <div
                          className="Take_picture"
                          onClick={handleTakepicture}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M8 4C8 3.44772 8.41328 3 8.92308 3H15.0769C15.5867 3 16 3.44772 16 4C16 4.55228 15.5867 5 15.0769 5H8.92308C8.41328 5 8 4.55228 8 4Z"
                              // fill="#1C274C"
                            />
                            <path
                              fill-rule="evenodd"
                              clip-rule="evenodd"
                              d="M9.77778 21H14.2222C17.3433 21 18.9038 21 20.0248 20.2777C20.51 19.965 20.9267 19.5632 21.251 19.0953C22 18.0143 22 16.5095 22 13.4999C22 10.4903 21.9998 8.9857 21.2508 7.90473C20.9266 7.43676 20.5099 7.03497 20.0246 6.72228C18.9036 6 17.3431 6 14.2221 6H9.77761C6.65659 6 5.09607 6 3.97508 6.72228C3.48979 7.03497 3.07312 7.43676 2.74886 7.90473C2 8.98547 2 10.4896 2 13.4979L2 13.4999C2 16.5095 2 18.0143 2.74902 19.0953C3.07328 19.5632 3.48995 19.965 3.97524 20.2777C5.09624 21 6.65675 21 9.77778 21ZM7.83333 13.4999C7.83333 11.2808 9.69881 9.48196 12 9.48196C14.3012 9.48196 16.1667 11.2808 16.1667 13.4999C16.1667 15.7189 14.3012 17.5178 12 17.5178C9.69881 17.5178 7.83333 15.7189 7.83333 13.4999ZM9.5 13.4999C9.5 12.1685 10.6193 11.0891 12 11.0891C13.3807 11.0891 14.5 12.1685 14.5 13.4999C14.5 14.8313 13.3807 15.9106 12 15.9106C10.6193 15.9106 9.5 14.8313 9.5 13.4999ZM18.1111 9.48196C17.6509 9.48196 17.2778 9.84174 17.2778 10.2855C17.2778 10.7294 17.6509 11.0891 18.1111 11.0891H18.6667C19.1269 11.0891 19.5 10.7294 19.5 10.2855C19.5 9.84174 19.1269 9.48196 18.6667 9.48196H18.1111Z"
                              // fill="#1C274C"
                            />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Loader />
          )}
        </>
      ) : (
        <NoChat />
      )}
    </div>
  );
};

export default Chat;
