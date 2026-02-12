import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/about-me/",
    plugins: [tailwindcss(), react()],
    server: {
        port: 4174,
        strictPort: true,
    },
    test: {
        environment: "jsdom",
    },
});
