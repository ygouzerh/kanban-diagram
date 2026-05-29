import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from https://ygouzerh.github.io/kanban-diagram/ on GitHub Pages
  base: "/kanban-diagram/",
  plugins: [react()],
});
