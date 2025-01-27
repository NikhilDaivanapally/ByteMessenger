import { useEffect, useRef, useState } from "react";
import { CiImageOn } from "react-icons/ci";
import { HiDownload } from "react-icons/hi";
import { IoIosArrowDown } from "react-icons/io";
import "./Chat.css";
import { useDispatch, useSelector } from "react-redux";
import { LuClock4 } from "react-icons/lu";
import { setfullImagePreview } from "../../store/slices/conversation";
import formatTime from "../../utils/formatTime";
import formatTime2 from "../../utils/formatTime2";
import { FaPause } from "react-icons/fa6";
import { IoPlay } from "react-icons/io5";
import WaveSurfer from "wavesurfer.js";
import SenderFromGroup from "../../utils/SenderFromGroup";
const TextMsg = ({ el }) => {
  const { chat_type } = useSelector((state) => state.app);
  const { sender } = SenderFromGroup(el);
  const { Time } = formatTime(el.createdAt);

  return (
    <div className={`Text_msg ${el.incoming ? "start" : "end"}`}>
      {chat_type !== "individual" && el.incoming && (
        <div className="user_profile">
          <img className="img" src={sender?.avatar} alt="" />
        </div>
      )}
      <div className="actual_msg">
        {" "}
        <div className="msg_info">
          {chat_type !== "individual" && (
            <p className="userName">{sender?.userName}</p>
          )}
          <p>{el.message?.text}</p>
        </div>
        <div className="time_Stamp">
          {!el?.incoming ? (
            el?.status == "pending" ? (
              <LuClock4 />
            ) : (
              <div className="dot_container">
                <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
                <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
              </div>
            )
          ) : (
            ""
          )}
          <p className="time">{Time}</p>
        </div>
      </div>
    </div>
  );
};

const MediaMsg = ({ el, scrollToBottom }) => {
  const { chat_type } = useSelector((state) => state.app);

  const { sender } = SenderFromGroup(el);

  const dispatch = useDispatch();
  // const [openMoreOptions, setOpenMoreOptions] = useState(false);
  // const handleMoreOptions = () => {
  //   setOpenMoreOptions((prev) => !prev);
  // };

  const { Time } = formatTime(el?.createdAt);

  return (
    <div className={`Media_msg ${el?.incoming ? "start" : "end"}`}>
      {chat_type !== "individual" && el.incoming && (
        <div className="user_profile">
          <img className="img" src={sender?.avatar} alt="" />
        </div>
      )}
      <div>
        <div className="Media_Container">
          {chat_type !== "individual" && (
            <p className="userName">{sender?.userName}</p>
          )}
          <div
            className="Img_Container"
            onClick={() => {
              dispatch(setfullImagePreview({ fullviewImg: el }));
            }}
          >
            <img
              src={el?.message?.photoUrl}
              alt={""}
              style={{ userSelect: "none" }}
              onLoad={scrollToBottom}
            />
            {el.status == "pending" && (
              <svg className="Img_loader" viewBox="20 24 60 70">
                <circle className="spin" r="20" cy="50" cx="50"></circle>
              </svg>
            )}
          </div>
          {el?.message?.description && (
            <p className="msg">{el?.message?.description}</p>
          )}
        </div>
        <div className="time_Stamp">
          {!el?.incoming ? (
            el?.status === "pending" ? (
              <LuClock4 />
            ) : (
              <div className="dot_container">
                <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
                <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
              </div>
            )
          ) : (
            ""
          )}
          <p className="">{Time}</p>
        </div>
      </div>
    </div>
  );
};

const AudioMsg = ({ el }) => {
  const { chat_type } = useSelector((state) => state.app);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);

  // Get user details if the message is incoming
  const { sender } = SenderFromGroup(el);
  const { Time } = formatTime(el?.createdAt);

  // Fetch audio when the component is mounted
  useEffect(() => {
    if (el.status === "sent" && el?.message?.audioId) {
      fetch(`https://byte-messenger-api.onrender.com/api/audio/${el.message.audioId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Audio not found");
          }
          return response.blob();
        })
        .then((audioBlob) => {
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        })
        .catch((error) => console.error("Error fetching audio:", error));

      return () => {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    } else if (el.status == "pending") {
      setAudioUrl(el?.message?.audioId);
    }
  }, [el?.message?.url]);

  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      waveSurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#fff",
        progressColor: "#d2d2d2",
        cursorColor: "transparent",
        height: 20,
        responsive: true,
        interact: true,
        barWidth: 2,
        barRadius: 5,
        barHeight: 10,
        backend: "WebAudio",
      });

      waveSurferRef.current.load(audioUrl);

      waveSurferRef.current.on("ready", () => {
        setDuration(waveSurferRef.current.getDuration());
      });

      waveSurferRef.current.on("audioprocess", () => {
        setCurrentTime(waveSurferRef.current.getCurrentTime());
      });

      waveSurferRef.current.on("finish", () => {
        setIsPlaying(false);
      });

      return () => {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
      };
    }
  }, [audioUrl]);

  // Play/Pause functionality
  const handlePlayPauseAudio = () => {
    if (isPlaying) {
      waveSurferRef.current?.pause();
      setIsPlaying(false);
    } else {
      waveSurferRef.current?.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className={`Audio_msg ${el?.incoming ? "start" : "end"}`}>
      {chat_type !== "individual" &&
        el?.incoming(
          <div className="user_profile">
            <img className="img" src={sender?.avatar} alt="" />
          </div>
        )}

      {el?.message?.audioId && (
        <div className="Audio_">
          <div className="Audio_Container">
            {chat_type !== "individual" && (
              <p className="userName">{sender?.userName}</p>
            )}

            {audioUrl ? (
              <div className="Audio_ctrl">
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
                <div ref={waveformRef} id="waveform"></div>
                <span className="recorded_duration">
                  {" "}
                  {isPlaying ? (
                    <>
                      {Math.floor(duration)
                        ? `00:${Math.floor(duration - currentTime)
                            .toString()
                            .padStart(2, "0")}`
                        : "00:00"}
                    </>
                  ) : (
                    <>
                      {`00:${Math.floor(duration).toString().padStart(2, "0")}`}
                    </>
                  )}
                </span>
              </div>
            ) : (
              <p>Loading audio...</p>
            )}
          </div>
          <div className="time_Stamp">
            {!el?.incoming ? (
              el?.status === "pending" ? (
                <LuClock4 />
              ) : (
                <div className="dot_container">
                  <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
                  <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
                </div>
              )
            ) : (
              ""
            )}
            <p>{Time}</p>
          </div>
        </div>
      )}
      <audio
        ref={audioRef}
        hidden
        controls
        src={audioUrl}
        className="audioPlayer"
      ></audio>
    </div>
  );
};

const DocMsg = ({ el }) => {
  const { chat_type } = useSelector((state) => state.app);

  const [openMoreOptions, setOpenMoreOptions] = useState(false);
  const handleMoreOptions = () => {
    setOpenMoreOptions((prev) => !prev);
  };
  return (
    <div className={`Doc_msg ${el.incoming ? "start" : "end"}  `}>
      {openMoreOptions && (
        <div className={`Menu_options`}>
          <p className="option">Reply</p>
          <p className="option">Delete</p>
        </div>
      )}
      <IoIosArrowDown
        className={`Menu_btn ${openMoreOptions ? "stay" : "close"}`}
        onClick={handleMoreOptions}
      ></IoIosArrowDown>

      <CiImageOn />
      <p>Abstract.png</p>
      <HiDownload />
    </div>
  );
};
const LinkMsg = ({ el }) => {
  const { chat_type, friends } = useSelector((state) => state.app);

  const { sender } = SenderFromGroup(el);

  const { Time } = formatTime(el.createdAt);
  return (
    <div className={`Link_msg ${el.incoming ? "start" : "end"}  `}>
      {chat_type !== "individual" && el.incoming && (
        <div className="user_profile">
          <img className="img" src={sender?.avatar} alt="" />
        </div>
      )}
      <div>
        <div className="msg_info">
          {chat_type !== "individual" && (
            <p className="userName">{sender?.userName}</p>
          )}
          <a target="_blank" href={el.message?.text} className="msg">
            {el.message?.text}
          </a>
        </div>
        <div className="time_Stamp">
          {!el?.incoming ? (
            el?.status == "pending" ? (
              <LuClock4 />
            ) : (
              <div className="dot_container">
                <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
                <div className={`dot ${el.seen ? "seen" : "unseen"}`}></div>
              </div>
            )
          ) : (
            ""
          )}
          <p>{Time}</p>
        </div>
      </div>
    </div>
  );
};
const Timeline = ({ date }) => {
  const formatTime = formatTime2(date);

  return (
    <div className="Timeline_msg">
      <p className="text">{formatTime}</p>
    </div>
  );
};
const ReplyMsg = ({ el }) => {};

export { TextMsg, MediaMsg, DocMsg, LinkMsg, ReplyMsg, AudioMsg, Timeline };
