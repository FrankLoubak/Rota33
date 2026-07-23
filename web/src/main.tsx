/**
 * Finalidade: bootstrap do app web (esqueleto Sprint 0).
 * Como funciona: monta App na div #root. Router e telas entram a partir do Sprint 3.
 * Relações: App.tsx (raiz da UI).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
