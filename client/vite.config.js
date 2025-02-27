import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    fs: {
      strict: false,
    },
    // proxy: {
    //   "/api": {
    //     target: "https://byte-messenger-api.onrender.com",
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ""),
    //   },
    // },
  },
  plugins: [react()],
});
