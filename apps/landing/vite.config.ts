import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/",
    plugins: [tailwindcss(), react()],
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
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
        },
    },
    test: {
        environment: "jsdom",
    },
});
