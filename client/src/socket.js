import { io } from "socket.io-client";

let socket;

const connectSocket = (auth_id) => {
  return new Promise((resolve, reject) => {
    socket = io("http://localhost:8000", {
      query: { auth_id },
    });

    socket.on("connect", () => {
      // console.log('connect')
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      reject(err);
    });
  });
};

export { socket, connectSocket };
