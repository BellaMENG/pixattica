import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const blogApiProxyTarget = process.env.BLOG_API_PROXY_TARGET ?? "http://localhost:4176";

export default defineConfig({
    base: "/",
    plugins: [tailwindcss(), react()],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: blogApiProxyTarget,
                changeOrigin: true,
                ws: true,
            },
            "/about-me": {
                target: "http://localhost:4174",
                changeOrigin: true,
                ws: true,
            },
            "/pixel-collage": {
                target: "http://localhost:4175",
                changeOrigin: true,
                ws: true,
            },
            "/reading": {
                target: "http://localhost:4178",
                changeOrigin: true,
                ws: true,
            },
        },
    },
    test: {
        environment: "jsdom",
    },
});
