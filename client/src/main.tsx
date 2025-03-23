import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add remixicon CSS
const link = document.createElement("link");
link.href = "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
link.rel = "stylesheet";
document.head.appendChild(link);

createRoot(document.getElementById("root")!).render(<App />);
