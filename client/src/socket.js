import { io } from "socket.io-client";

let socket;

const connectSocket = (auth_id) => {
  return new Promise((resolve, reject) => {
    socket = io("https://byte-messenger-api.onrender.com", {
      query: { auth_id },
    });

    socket.on("connect", () => {
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      reject(err);
    });
  });
};

export { socket, connectSocket };
