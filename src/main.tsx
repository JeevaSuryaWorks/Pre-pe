import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react"
import App from "./App.tsx";
import "./index.css";
import { adminLogService } from "./services/AdminLogService";

// Initialize global log interceptor
adminLogService.init();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>
);
