import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/reading/",
    plugins: [tailwindcss(), react()],
    server: {
        port: 4178,
    },
    test: {
        environment: "jsdom",
    },
});
