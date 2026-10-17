import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SiteRouter from "./SiteRouter";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <SiteRouter />
    </StrictMode>,
);
