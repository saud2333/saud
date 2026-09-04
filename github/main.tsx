import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import KuwaitCoursesApp from "../app/components/KuwaitCoursesApp";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Mirsad root element was not found");

createRoot(root).render(
  <StrictMode>
    <KuwaitCoursesApp />
  </StrictMode>,
);
