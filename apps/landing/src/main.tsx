import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const isOsLandingEnabled = import.meta.env.VITE_OS_LANDING === "true";
const isResumePage = window.location.pathname === "/cv";
const showBagLanding = !isOsLandingEnabled || isResumePage;
document.documentElement.classList.toggle("bag-landing-enabled", showBagLanding);
if (isResumePage) {
    document.title = "Bella Meng | CV";
}

const appModule = isResumePage
    ? import("./ResumeApp.tsx")
    : isOsLandingEnabled
      ? import("./App.tsx")
      : import("./BagLanding.tsx");

void appModule.then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
});
