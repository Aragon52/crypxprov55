import { createRoot } from "react-dom/client";
import App from "@/App.tsx";
import { marketService } from "@/services/market";
import "./index.css";

// Intercept and swallow benign network fetch errors (CORS, offline, aborted requests)
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = typeof reason === "string" ? reason : reason?.message || "";
    if (
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("AbortError") ||
      msg.includes("Load failed")
    ) {
      event.preventDefault();
      console.debug("Intercepted background fetch error:", msg);
    }
  });
}

// Initialize market service
marketService.init();

// Service Worker registration — guarded against preview/iframe
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if ("serviceWorker" in navigator && !isInIframe && !isPreviewHost) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
} else if (isPreviewHost || isInIframe) {
  // Unregister any existing SW in preview contexts
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
