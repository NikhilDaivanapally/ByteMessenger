import React, { useEffect, useRef, useState } from "react";
import { RxCross2 } from "react-icons/rx";
import { RiArrowDownSFill } from "react-icons/ri";
import "./GroupDialog.css";
import { useSelector } from "react-redux";
import { CgProfile } from "react-icons/cg";
import { socket } from "../../../socket";
import { useCreateGroupMutation } from "../../../store/slices/apiSlice";
import toast from "react-hot-toast";
import Dialog from "../../Dialog/Dialog";
import AuthLoader from "../../AuthLoader/AuthLoader";
const GroupDialog = ({ openDialog, handlecloseDialog }) => {
  const titleRef = useRef(null);
  const inptRef = useRef(null);
  const optionRef = useRef(null);
  const { friends } = useSelector((state) => state.app);
  const auth_user = useSelector((state) => state.auth.user);
  const [FriendsList, setFriendsList] = useState(friends);
  const [selected, setSelect] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [creategroupdata, setCreategroupdata] = useState({
    title: "",
    avatar: null,
    users: selected,
    admin: auth_user._id,
    chat_type: "group",
  });

  const [createGroup, { isSuccess, data, isLoading }] =
    useCreateGroupMutation();

  useEffect(() => {
    if (isSuccess && data.data) {
      socket.emit("group_created", data.data);
    }
  }, [isSuccess]);

  const handleFocus = () => {
    if (titleRef.current && inptRef.current && optionRef.current) {
      titleRef.current.classList.add("lift");
      inptRef.current.focus();
      optionRef.current.style.display = "block";
    }
  };
  const handleUnFocus = () => {
    if (
      titleRef.current &&
      inptRef.current &&
      optionRef.current &&
      !selected.length
    ) {
      titleRef.current.classList.remove("lift");
      inptRef.current.blur();
      optionRef.current.style.display = "none";
      setActiveIndex(0);
    }
  };
  const handleShowFriends = (e) => {
    e.stopPropagation();
    optionRef.current.style.display == "block"
      ? (optionRef.current.style.display = "none")
      : (optionRef.current.style.display = "block");
  };
  const handleClearMemebers = (e) => {
    setSelect([]);
  };
  const handleSelect = (el) => {
    let selectedelem = el;
    setSelect((prev) => [...prev, selectedelem]);
  };

  const handleRemoveSelected = (el) => {
    let newSelected = selected.filter((elem) => elem._id !== el._id);
    setSelect(newSelected);
  };
  const handleArrowUp = () => {
    activeIndex > 0
      ? setActiveIndex((prev) => prev - 1)
      : setActiveIndex(FriendsList.length - 1);
  };
  const handleArrowDown = () => {
    activeIndex < FriendsList.length - 1
      ? setActiveIndex((prev) => {
          return prev + 1;
        })
      : setActiveIndex(0);
  };
  const handleBackspace = (e) => {
    !e.target.value &&
      selected.length > 0 &&
      handleRemoveSelected(selected[selected.length - 1]);
    // setTitle("");
    // setFriendsList(friends);
    // setSelect([]);
  };
  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
        handleSelect(FriendsList[activeIndex]);
        break;
      case "ArrowUp":
        handleArrowUp();
        break;
      case "ArrowDown":
        handleArrowDown();
        break;
      case "Backspace":
        handleBackspace(e);
        break;
      default:
        break;
    }
  };
  const handleCreategroup = async () => {
    if (!creategroupdata.title && !creategroupdata.users.length) {
      toast.error("group Title and members field shouldn't be empty");
    } else {
      const data = new FormData();
      for (let key in creategroupdata) {
        if (Array.isArray(creategroupdata[key])) {
          data.append(key, JSON.stringify(creategroupdata[key]));
        } else {
          data.append(key, creategroupdata[key]);
        }
      }
      await createGroup(data);
    }
  };
  useEffect(() => {
    setActiveIndex(0);
    setCreategroupdata({ ...creategroupdata, users: selected });
    let newFriendList = friends.filter((el) => !selected.includes(el));
    setFriendsList(newFriendList);
  }, [selected]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setCreategroupdata({ ...creategroupdata, [name]: files[0] });
  };
  return (
    <Dialog onClose={handlecloseDialog}>
      <div className="GroupChats_Dialog_Box">
        <div className="TopSection">
          <p>Create New Group</p>
          <RxCross2
            className="Group_Dialog_Close"
            onClick={handlecloseDialog}
          />
        </div>
        <div className="BottomSection">
          <div className="avatar_container">
            <label>Avatar :</label>
            <div className="choose">
              <input
                type="file"
                id="select"
                name="avatar"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
              {!creategroupdata.avatar ? (
                <label htmlFor="select" className="select">
                  Choose File
                </label>
              ) : (
                <div className="previewer">
                  <img
                    src={URL.createObjectURL(creategroupdata.avatar)}
                    alt="avatar"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="Title_input">
            <input
              className="inpt"
              type="text"
              value={creategroupdata.title}
              onChange={(e) =>
                setCreategroupdata({
                  ...creategroupdata,
                  title: e.target.value,
                })
              }
              onFocus={(e) => {
                e.target.nextSibling.classList.add("lift");
              }}
              onBlur={(e) => {
                !creategroupdata.title &&
                  e.target.nextSibling.classList.remove("lift");
              }}
            />
            <span className="input_name">Title *</span>
          </div>
          <div
            className="Select_Members_Container"
            tabIndex="-1"
            onFocus={handleFocus}
            onBlur={handleUnFocus}
          >
            <span className="input_name" ref={titleRef}>
              Members
            </span>

            <div className="Selected_Member_input">
              <div className="selected_Members">
                {selected.length > 0 &&
                  selected.map((el, i) => {
                    return (
                      <div className="capsule" key={`capsule_${i}`}>
                        <img src={el.avatar} alt="" />
                        <p>{el.userName}</p>
                        <RxCross2 onClick={() => handleRemoveSelected(el)} />
                      </div>
                    );
                  })}
              </div>

              <input
                type="text"
                placeholder="Add Member"
                ref={inptRef}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  optionRef.current.style.display = "none";
                }}
              />
            </div>
            <div className="Select_Members_Controller">
              {selected.length > 0 && (
                <RxCross2 onClick={handleClearMemebers} />
              )}
              <RiArrowDownSFill onClick={handleShowFriends} />
            </div>
            <div className="Friends" ref={optionRef}>
              {FriendsList.map((el, i) => {
                return (
                  <div
                    className={`friend ${activeIndex == i && "activeindex"}`}
                    key={i}
                    onClick={() => handleSelect(el)}
                  >
                    {el.avatar ? (
                      <img className="img" src={el.avatar} alt="" />
                    ) : (
                      <CgProfile className="noimg" />
                    )}
                    <p>{el.userName}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <button className="CreateGroup_btn" onClick={handleCreategroup}>
            {isLoading ? <AuthLoader /> : "Create Group"}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default GroupDialog;
