import { useSelector } from "react-redux";

const SenderFromGroup = (el) => {
  const { GroupConversations } = useSelector(
    (state) => state.conversation.group_chat
  );
  const { chat_type } = useSelector((state) => state.app);
  let sender;
  if (chat_type !== "individual" && !el.outgoing) {
    GroupConversations.map((conv) => {
      if (conv.id === el?.conversationId || conv.id === el?.id) {
        const foundUser = [...conv?.users, conv?.admin].find(
          (user) => el.from == user._id
        );
        if (foundUser) {
          sender = {
            avatar: foundUser.avatar,
            userName: foundUser.userName,
          };
        }
      }
    });
  }
  return { sender };
};

export default SenderFromGroup;
