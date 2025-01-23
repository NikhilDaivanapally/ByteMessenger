import { BiChat, BiSolidChat } from "react-icons/bi";
import { TiGroup, TiGroupOutline } from "react-icons/ti";
import { PiUserCirclePlusLight, PiUserCirclePlusFill } from "react-icons/pi";
const Navigates = [
  {
    icon: <BiChat />,
    active_icon: <BiSolidChat />,
    navigate: "/",
    name: "Chats",
  },
  {
    icon: <TiGroupOutline />,
    active_icon: <TiGroup />,
    navigate: "/group",
    name: "Groups",
  },
  {
    icon: <PiUserCirclePlusLight />,
    active_icon: <PiUserCirclePlusFill />,
    navigate: "/connect",
    name: "connect",
  },
];

export { Navigates };
