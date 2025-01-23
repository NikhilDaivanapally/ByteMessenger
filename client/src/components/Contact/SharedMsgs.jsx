import React, { useEffect, useRef, useState } from "react";
import "./SharedMsgs.css";
import { updateSidebarType } from "../../store/slices/appSlice";
import { useDispatch, useSelector } from "react-redux";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { faker } from "@faker-js/faker";
import { setfullImagePreview } from "../../store/slices/conversation";
import SortMessages from "../../utils/SortMessages";
import { AudioMsg, LinkMsg } from "../Conversation/Msgtype";

const Media = () => {
  const dispatch = useDispatch();
  const { current_direct_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { DatesArray, MessagesObject } = SortMessages({
    messages: current_direct_messages,
    filter: "media",
    sort: "Desc",
  });

  return (
    <>
      {DatesArray?.map((date, i) => {
        return (
          <div key={i} className="TimeWise_Media_Container">
            <p>{date}</p>
            <div className="Gallery">
              {MessagesObject[date].map((el) => (
                <img
                  src={el.message.url}
                  alt=""
                  onClick={() =>
                    dispatch(setfullImagePreview({ fullviewImg: el }))
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Audio = () => {
  // const dispatch = useDispatch();
  const { current_direct_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const { DatesArray, MessagesObject } = SortMessages({
    messages: current_direct_messages,
    filter: "audio",
    sort: "Desc",
  });

  return (
    <>
      {DatesArray?.map((date, i) => {
        return (
          <div key={i} className="TimeWise_Media_Container">
            <p>{date}</p>
            <div className="Audio_Gallery">
              {MessagesObject[date].map((el) => (
                <AudioMsg el={el} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const Links = () => {
  const { current_direct_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { DatesArray, MessagesObject } = SortMessages({
    messages: current_direct_messages,
    filter: "link",
    sort: "Desc",
  });

  return (
    <>
      {DatesArray?.map((date, i) => {
        return (
          <div key={i} className="TimeWise_Media_Container">
            <p>{date}</p>
            <div className="Links_Gallery">
              {MessagesObject[date].map((el) => (
                // <LinkMsg el={el} />
                <a
                  target="_blank"
                  href={el.message}
                  className="msg"
                  style={{ textDecoration: "none" }}
                >
                  {el.message}
                </a>
                // <img
                //   src={el.message.url}
                //   alt=""
                //   onClick={() =>
                //     dispatch(setfullImagePreview({ fullviewImg: el }))
                //   }
                // />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const SharedMsgs = () => {
  const dispatch = useDispatch();
  const { sideBar } = useSelector((state) => state.app);
  const handleChangeSidebar = () => {
    dispatch(updateSidebarType({ type: "CONTACT" }));
  };

  const Media_Controllers = ["Media", "Audio", "Links", "Docs"];

  const InitialElemRef = useRef(null);
  const barRef = useRef(null);
  const [activefield, setActivefield] = useState("Media");
  useEffect(() => {
    if (InitialElemRef && barRef) {
      let Dimensions = InitialElemRef.current.getBoundingClientRect();
      barRef.current.style.width = `${Dimensions.width}px`;
    }
  }, []);

  const handlebarChange = (e) => {
    let Dimensions = InitialElemRef.current.getBoundingClientRect();

    const targetDimensions = e.target.getBoundingClientRect();
    const left = targetDimensions.x - Dimensions.x;
    barRef.current.style.left = `${left}px`;
    barRef.current.style.width = `${targetDimensions.width}px`;
    setActivefield(e.target.innerText);
  };
  return (
    <div
      className={`SharedMsg_Container ${
        sideBar.open && sideBar.type === "SHARED" && "open"
      }`}
    >
      <div className="Close_SharedMsg_Container">
        <MdKeyboardArrowLeft
          className="Close_btn"
          onClick={handleChangeSidebar}
        />
      </div>

      <div className="showMediaMsg_Container">
        <div className="controller_section">
          {/* bar */}
          <div className="bar" ref={barRef}></div>
          {Media_Controllers.map((el, index) => {
            return (
              <div key={el}>
                {index == 0 ? (
                  <p ref={InitialElemRef} onClick={handlebarChange}>
                    {el}
                  </p>
                ) : (
                  <p onClick={handlebarChange}>{el}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="view_section">
          {(() => {
            switch (activefield) {
              case "Media":
                return <Media />;
              case "Audio":
                return <Audio />;
              case "Links":
                return <Links />;
              case "Docs":
                return <div>Docs</div>;
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default SharedMsgs;
