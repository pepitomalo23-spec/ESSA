import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow-condensed/latin-500.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "./index.css";
import "./lib/install";

// La web no se amplía: Safari en iPhone ignora user-scalable=no, así que se cortan también sus gestos de pellizco
// (y el pellizco del trackpad, que llega como rueda con Ctrl).
const noZoom = (e: Event) => e.preventDefault();
document.addEventListener("gesturestart", noZoom);
document.addEventListener("gesturechange", noZoom);
document.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
