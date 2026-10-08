import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./professional.css";
import "./domain/sport-core";

const root = document.getElementById("root");
if (!root) throw new Error("Stride root element was not found.");

createRoot(root).render(<App />);
