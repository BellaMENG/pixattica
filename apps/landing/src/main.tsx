import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const isBagLandingEnabled = import.meta.env.VITE_BAG_LANDING === "true";
const isResumePage = window.location.pathname === "/cv";
document.documentElement.classList.toggle("bag-landing-enabled", isBagLandingEnabled);
if (isBagLandingEnabled && isResumePage) {
    document.title = "Bella Meng | CV";
}

const appModule = isBagLandingEnabled
    ? isResumePage
        ? import("./ResumeApp.tsx")
        : import("./BagLanding.tsx")
    : import("./App.tsx");

void appModule.then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
});
