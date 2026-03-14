import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/pixel-collage/",
    plugins: [tailwindcss(), react()],
    server: {
        port: 4175,
        strictPort: true,
    },
    test: {
        environment: "jsdom",
    },
});
