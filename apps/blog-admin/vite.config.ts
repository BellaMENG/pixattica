import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const blogApiProxyTarget = process.env.BLOG_API_PROXY_TARGET ?? "http://localhost:4176";

export default defineConfig({
    plugins: [tailwindcss(), react()],
    server: {
        port: 4177,
        proxy: {
            "/api": {
                target: blogApiProxyTarget,
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: "jsdom",
    },
});
