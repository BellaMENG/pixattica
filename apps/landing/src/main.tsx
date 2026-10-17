import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const isBagLandingEnabled = import.meta.env.VITE_BAG_LANDING === "true";
document.documentElement.classList.toggle("bag-landing-enabled", isBagLandingEnabled);

const appModule = isBagLandingEnabled ? import("./BagLanding.tsx") : import("./App.tsx");

void appModule.then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
});
