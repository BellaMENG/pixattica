import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const isOsLandingEnabled = import.meta.env.VITE_OS_LANDING === "true";
const isResumePage = window.location.pathname === "/cv";
const showBagLanding = !isOsLandingEnabled || isResumePage;
document.documentElement.classList.toggle("bag-landing-enabled", showBagLanding);
if (isResumePage) {
    document.title = "Bella Meng | CV";
}

function mountApp(App: ComponentType) {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}

if (isResumePage) {
    void import("./ResumeApp.tsx").then(({ default: App }) => mountApp(App));
} else if (isOsLandingEnabled) {
    void import("./App.tsx").then(({ default: App }) => mountApp(App));
} else {
    void import("./BagLanding.tsx").then(({ default: App }) => mountApp(App));
}
