import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CivilApp from "../app/components/CivilAppV2";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("CivilKuwait root element was not found");

document.documentElement.style.setProperty("--civil-hero-image", "url('/saud/civilkuwait-sustainable-hero.png')");
document.documentElement.style.setProperty("--civil-engineers-image", "url('/saud/fictional-engineers-grid.png')");

createRoot(root).render(
  <StrictMode>
    <CivilApp />
  </StrictMode>,
);
