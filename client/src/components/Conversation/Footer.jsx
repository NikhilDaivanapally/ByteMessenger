import React, { useRef, useState, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { FaPause } from "react-icons/fa6";
import { ImAttachment } from "react-icons/im";
import { IoMdPhotos } from "react-icons/io";
import { IoDocumentText, IoMic, IoPlay } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { socket } from "../../socket";
import Dialog from "../Dialog/Dialog";
import { TbSend2 } from "react-icons/tb";
import { MdDelete } from "react-icons/md";
import { BiSolidCamera } from "react-icons/bi";
import {
  addDirectMessage,
  addGroupMessage,
} from "../../store/slices/conversation";
import myThrottle from "../../utils/myThrottle";
import { updateOpenCamera } from "../../store/slices/appSlice";

const Footer = ({ setIsNonTextmsg, isNonTextmsg }) => {
  const { _id: auth_id, userName } = useSelector((state) => state.auth.user)

  const [inputMsg, setInputMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sharefiles, setSharefiles] = useState(false);
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const { room_id, chat_type } = useSelector((state) => state.app);

  const { current_direct_conversation, current_direct_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { current_group_conversation } = useSelector(
    (state) => state.conversation.group_chat
  );

  const Actions_array = [
    {
      icon: <IoDocumentText />,
      action: "Documents",
      accept: ".pdf, .doc, .docx, .xls, .xlsx",
    },
    { icon: <IoMdPhotos />, action: "Photos & Videos", accept: "image/*" },
    // {icon:}
  ];

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
  // handle the emoji select
  const handleEmojiClick = (emoji) => {
    setInputMsg((prev) => prev + emoji);
    handleToggleEmojiPicker();
  };
  const containsUrl = (text) => /(https?:\/\/[^\s]+)/gi.test(text);

  const handleInputChange = (e) => setInputMsg(e.target.value);
  const handle_sharefiles = () => setSharefiles((prev) => !prev);
  const handleToggleEmojiPicker = () => setShowEmojiPicker((prev) => !prev);

  // Handle send Message
  const handleSendMsg = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const to =
      chat_type === "individual"
        ? current_direct_conversation.user_id
        : userList;
    const messageId = crypto.randomUUID();
    const messageCreatedAt = new Date().toISOString();
    switch (true) {
      case inputMsg && chat_type === "individual":
        dispatch(
          addDirectMessage({
            id: messageId,
            type: containsUrl(inputMsg) ? "link" : "text",
            message: {
              text: inputMsg,
            },
            createdAt: messageCreatedAt,
            updatedAt: messageCreatedAt,
            incoming: false,
            outgoing: true,
            status: "pending",
            seen: false,
          })
        );
        break;
      case inputMsg && chat_type !== "individual":
        dispatch(
          addGroupMessage({
            id: messageId,
            type: containsUrl(inputMsg) ? "link" : "text",
            message: {
              text: inputMsg,
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
        break;
      default:
        break;
    }

    socket.emit("text_message", {
      _id: messageId,
      sender: auth_id,
      recipients: to,
      messageType: containsUrl(inputMsg) ? "link" : "text",
      message: {
        text: inputMsg,
      },
      conversationType:
        chat_type == "individual" ? "OneToOneMessage" : "OneToManyMessage",
      conversationId: room_id,
      createdAt: messageCreatedAt,
      updatedAt: messageCreatedAt,
    });
    setInputMsg("");
  };

  // Handle emit the Typing and Stop_Typing event
  const handle_typingstatus = (() => {
    let typingTimeout;
    let isTyping = false;
    const current_conversation =
      chat_type === "individual"
        ? current_direct_conversation?.user_id
        : userList;
    return () => {
      if (!isTyping) {
        socket.emit("Typing", {
          room_id,
          currentUser: { auth_id, userName },
          type: chat_type,
          current_conversation,
        });
        isTyping = true;
      }

      if (typingTimeout) clearTimeout(typingTimeout);

      typingTimeout = setTimeout(() => {
        socket.emit("Stop_Typing", {
          room_id,
          currentUser: { auth_id, userName },
          type: chat_type,
          current_conversation,
        });
        isTyping = false;
      }, 3000);
    };
  })();

  // handle Input typing status
  const handleInputTyping = myThrottle(handle_typingstatus, 2000);

  // make input to be focused on defined dependencies
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [current_direct_messages, current_direct_conversation, auth_id]);

  // show file sharing popup
  useEffect(() => {
    isNonTextmsg && handle_sharefiles();
  }, [isNonTextmsg]);

  //  audio releated states and handler functions

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const AudioChucksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState("recording");
  const [RecordingTime, setRecordingTime] = useState(0);
  // const [audioDuration, setAudioDuration] = useState(0);
  // const [LoadingAudio, setLoadingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      setupAudioVisualization(streamRef.current);
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [canvasRef.current]);

  const setupAudioVisualization = (stream) => {
    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);
    // analyser.connect(audioContext.destination);

    analyser.fftSize = 2048;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    draw();

    function draw() {
      if (!canvasRef.current) return;
      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#b721ff");
      gradient.addColorStop(1, "#21d4fd");

      ctx.lineWidth = 2;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.fill();
    }

    // Store references to audio context and analyser for cleanup
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  };

  const handleRecording = async () => {
    try {
      if (!isRecording && !mediaRecorderRef.current) {
        // Start recording for the first time
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream; // Store the stream reference
        mediaRecorderRef.current = new MediaRecorder(stream);

        AudioChucksRef.current = []; // Clear previous audio chunks

        // Collect audio data when available
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            AudioChucksRef.current.push(event.data);
          }
        };

        // Handle stopping the recording
        mediaRecorderRef.current.onstop = () => {
          // Create an audio Blob and URL
          const audioBlob = new Blob(AudioChucksRef.current, {
            type: "audio/wav",
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          // const audioElement = new Audio(audioUrl);

          // Optional: Set the audio URL and duration in state
          setAudioUrl(audioUrl);
          // audioElement.onloadedmetadata = () => {
          // };

          // Stop all audio tracks and clean up
          stream.getTracks().forEach((track) => track.stop());
          mediaRecorderRef.current = null;
        };

        // Start recording
        mediaRecorderRef.current.start();

        // Increment recording time every second
        const intervalId = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        mediaRecorderRef.current.intervalId = intervalId;

        // Update recording state
        setIsRecording(true);
        if (recordingState === "pause") setRecordingState("recording");
      } else if (isRecording) {
        // Stop recording completely
        mediaRecorderRef.current.stop();
        clearInterval(mediaRecorderRef.current.intervalId); // Clear timer
        // setIsRecording(false); // Update recording state
        setRecordingState("pause");
      }
    } catch (err) {
      console.error("Error during recording:", err);
    }
  };

  useEffect(() => {
    if (!recordingState && AudioChucksRef.current.length > 0) {
      const audioBlob = new Blob(AudioChucksRef.current, { type: "audio/wav" });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    }
  }, [AudioChucksRef.current, recordingState]);

  const handlePlayPauseAudio = () => {
    if (audioRef.current.paused) {
      setIsPlaying(true);
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      const updateCurrentTime = () => {
        setCurrentTime(audioRef.current.currentTime);
      };

      const updatePlaystate = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current.addEventListener("timeupdate", updateCurrentTime);
      audioRef.current.addEventListener("ended", updatePlaystate);
      // return () => {
      //   audioRef.current.removeEventListener("timeupdate", updateCurrentTime);
      //   audioRef.current.removeEventListener("ended", updatePlaystate);
      // };
    }
  }, [audioRef.current]);

  const handleSendAudio = () => {
    if (recordingState == "recording") {
      handleRecording();
    }

    const messageId = crypto.randomUUID();
    const messageCreatedAt = new Date().toISOString();

    chat_type === "individual"
      ? dispatch(
          addDirectMessage({
            id: messageId,
            type: "audio",
            message: {
              audioId: audioUrl,
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
            type: "audio",
            message: {
              audioId: audioUrl,
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

    socket.emit("audio_message", {
      _id: messageId,
      sender: auth_id,
      recipients: to,
      messageType: "audio",
      message: new Blob(AudioChucksRef.current, { type: "audio/wav" }),
      conversationType:
        chat_type == "individual" ? "OneToOneMessage" : "OneToManyMessage",
      conversationId: room_id,
      createdAt: messageCreatedAt,
      updatedAt: messageCreatedAt,
    });

    mediaRecorderRef.current = null;
    audioRef.current = null;
    streamRef.current = null;
    canvasRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;

    setIsRecording(false);
    setRecordingState("recording");
    setRecordingTime(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioUrl(null);
  };

  return (
    <form onSubmit={handleSendMsg}>
      <div className="footer">
        {!isRecording ? (
          // msg
          <>
            <>
              {sharefiles && (
                <Dialog onClose={handle_sharefiles}>
                  <div className="media_upload_conatiner">
                    {Actions_array.map((el, i) => (
                      <label
                        key={`${el}_${i}`}
                        className={`option ${el.action.split(" & ").join("_")}`}
                      >
                        {el.icon}
                        <p>{el.action}</p>
                        <input
                          type="file"
                          accept={el.accept}
                          hidden
                          multiple
                          onChange={(e) => {
                            setIsNonTextmsg(Object.values(e.target.files));
                          }}
                        />
                      </label>
                    ))}
                    <label
                      className="option Camera"
                      onClick={() => dispatch(updateOpenCamera(true))}
                    >
                      <BiSolidCamera />
                      <p>Camera</p>
                    </label>
                  </div>
                </Dialog>
              )}
              <ImAttachment
                className="attachment_icon"
                onClick={handle_sharefiles}
              />
            </>
            <div className="send_msg_inpt_Container">
              <div className="input">
                <input
                  ref={inputRef}
                  value={inputMsg}
                  onChange={handleInputChange}
                  onInput={handleInputTyping}
                  type="text"
                  placeholder=" write a message..."
                />
              </div>

              <div className="emoji">
                {showEmojiPicker && (
                  <div className="emoji_picker">
                    <Picker
                      theme="dark"
                      data={data}
                      onEmojiSelect={(emoji) => handleEmojiClick(emoji.native)}
                    />
                  </div>
                )}

                <BsEmojiSmile onClick={handleToggleEmojiPicker} />
              </div>
            </div>
          </>
        ) : (
          // Recording
          <div className="send_msg_inpt_Container Recording_container">
            <MdDelete className="deleteicon" />

            {audioUrl ? (
              <div className="Recording_time">
                <span
                  className="PlayPause-button"
                  onClick={handlePlayPauseAudio}
                >
                  {isPlaying ? (
                    <FaPause className="pauseicon" />
                  ) : (
                    <IoPlay className="playicon" />
                  )}
                </span>
                <input
                  type="range"
                  step="0.1"
                  max={RecordingTime || 0}
                  className="box__progress slider"
                  value={currentTime || 0}
                  onChange={(e) =>
                    (audioRef.current.currentTime = e.target.value)
                  }
                />
                <span className="recorded_duration">
                  {Math.floor(RecordingTime)
                    ? `00:${Math.floor(RecordingTime - currentTime)
                        .toString()
                        .padStart(2, "0")}`
                    : "00:00"}
                </span>
              </div>
            ) : (
              <div className="Recording_time">
                <span>
                  {" "}
                  {Math.floor(RecordingTime)
                    ? `00:${Math.floor(RecordingTime)
                        .toString()
                        .padStart(2, "0")}`
                    : "00:00"}
                </span>
                <canvas
                  ref={canvasRef}
                  className="wave-canvas"
                  // width="200"
                  // height="20"
                ></canvas>
              </div>
            )}
            <audio
              id="audio"
              controls
              hidden
              ref={audioRef}
              src={audioUrl ? audioUrl : ""}
              // onTimeUpdate={handlePlayAudioTimeUpdate}
              // onEnded={handleAudioOnEnd}
            ></audio>
            <div onClick={handleRecording}>
              {recordingState === "recording" ? (
                <FaPause className="pauseicon" />
              ) : (
                <IoMic className="voiceicon" />
              )}
            </div>
          </div>
        )}

        {inputMsg.trim() ? (
          <button className="send_msg_btn" type="submit">
            <TbSend2 />
          </button>
        ) : !isRecording ? (
          <div className="send_msg_btn" onClick={handleRecording}>
            {" "}
            <svg
              width="25px"
              height="25px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.25 8C5.25 4.27208 8.27208 1.25 12 1.25C15.7279 1.25 18.75 4.27208 18.75 8V13C18.75 16.7279 15.7279 19.75 12 19.75C8.27208 19.75 5.25 16.7279 5.25 13V8ZM12 2.75C9.10051 2.75 6.75 5.1005 6.75 8V13C6.75 15.8995 9.10051 18.25 12 18.25C14.8995 18.25 17.25 15.8995 17.25 13V8C17.25 5.10051 14.8995 2.75 12 2.75ZM10.5148 7.04546C10.2278 7.31681 9.77532 7.31971 9.48474 7.04498C9.18375 6.76042 9.17045 6.28573 9.45502 5.98474L9.98878 6.48939C9.45502 5.98474 9.45543 5.98431 9.45583 5.98388L9.45666 5.983L9.45836 5.98122L9.46192 5.97753L9.46967 5.96964C9.47512 5.96416 9.48113 5.95826 9.48774 5.95195C9.50094 5.93935 9.51647 5.92517 9.53447 5.9097C9.5705 5.87874 9.61625 5.84274 9.67283 5.80384C9.7863 5.72584 9.94135 5.6375 10.1461 5.55471C10.5565 5.38872 11.1539 5.25 12 5.25C12.8461 5.25 13.4435 5.38872 13.8539 5.55471C14.0587 5.6375 14.2137 5.72584 14.3272 5.80384C14.3837 5.84274 14.4295 5.87874 14.4655 5.9097C14.4835 5.92517 14.4991 5.93935 14.5123 5.95195C14.5189 5.95826 14.5249 5.96416 14.5303 5.96964L14.5381 5.97753L14.5416 5.98122L14.5433 5.983L14.5442 5.98388C14.5446 5.98431 14.545 5.98474 14.0112 6.48939L14.545 5.98474C14.8296 6.28573 14.8162 6.76042 14.5153 7.04498C14.2247 7.31971 13.7722 7.31681 13.4852 7.04546C13.4833 7.04403 13.4807 7.04216 13.4774 7.03991C13.4545 7.02416 13.3959 6.9875 13.2915 6.94529C13.0838 6.86128 12.6811 6.75 12 6.75C11.3189 6.75 10.9162 6.86128 10.7085 6.94529C10.6041 6.9875 10.5455 7.02416 10.5226 7.03991C10.5193 7.04216 10.5167 7.04402 10.5148 7.04546ZM13.4561 7.01645L13.4566 7.01695L13.4569 7.01721C13.4566 7.01696 13.4564 7.01671 13.4561 7.01645ZM10.5148 10.0455C10.2278 10.3168 9.77532 10.3197 9.48474 10.045C9.18375 9.76042 9.17045 9.28573 9.45502 8.98474L10 9.5C9.45502 8.98474 9.45542 8.98431 9.45583 8.98388L9.45666 8.983L9.45836 8.98122L9.46192 8.97753L9.46967 8.96964C9.47512 8.96416 9.48113 8.95826 9.48774 8.95195C9.50094 8.93935 9.51647 8.92517 9.53447 8.9097C9.5705 8.87874 9.61625 8.84274 9.67283 8.80384C9.7863 8.72584 9.94135 8.6375 10.1461 8.55471C10.5565 8.38872 11.1539 8.25 12 8.25C12.8461 8.25 13.4435 8.38872 13.8539 8.55471C14.0587 8.6375 14.2137 8.72584 14.3272 8.80384C14.3837 8.84274 14.4295 8.87874 14.4655 8.9097C14.4835 8.92517 14.4991 8.93935 14.5123 8.95195C14.5189 8.95826 14.5249 8.96416 14.5303 8.96964L14.5381 8.97753L14.5416 8.98122L14.5433 8.983L14.5442 8.98388C14.5446 8.98431 14.545 8.98474 14 9.5L14.545 8.98474C14.8296 9.28573 14.8162 9.76042 14.5153 10.045C14.2247 10.3197 13.7722 10.3168 13.4852 10.0455C13.4833 10.044 13.4807 10.0422 13.4774 10.0399C13.4545 10.0242 13.3959 9.9875 13.2915 9.9453C13.0838 9.86129 12.6811 9.75 12 9.75C11.3189 9.75 10.9162 9.86129 10.7085 9.9453C10.6041 9.9875 10.5455 10.0242 10.5226 10.0399C10.5193 10.0422 10.5167 10.044 10.5148 10.0455ZM13.4567 10.017C13.4566 10.0169 13.4564 10.0168 13.4563 10.0166C13.4561 10.0164 13.456 10.0163 13.4558 10.0161C13.4558 10.0161 13.4558 10.0161 13.4558 10.0161L13.4563 10.0166L13.4566 10.017L13.4567 10.017ZM3 10.25C3.41421 10.25 3.75 10.5858 3.75 11V13C3.75 17.5563 7.44365 21.25 12 21.25C16.5563 21.25 20.25 17.5563 20.25 13V11C20.25 10.5858 20.5858 10.25 21 10.25C21.4142 10.25 21.75 10.5858 21.75 11V13C21.75 18.3848 17.3848 22.75 12 22.75C6.61522 22.75 2.25 18.3848 2.25 13V11C2.25 10.5858 2.58579 10.25 3 10.25Z"
                fill="white"
              />
            </svg>
          </div>
        ) : (
          <div className="send_msg_btn" onClick={handleSendAudio}>
            <TbSend2 />
          </div>
        )}
      </div>
    </form>
  );
};

export default Footer;
