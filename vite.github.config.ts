import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "github"),
  base: "/saud/",
  publicDir: path.resolve(import.meta.dirname, "public"),
  plugins: [react()],
  build: {
    outDir: path.resolve(import.meta.dirname, "docs"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        index: path.resolve(import.meta.dirname, "github/index.html"),
        404: path.resolve(import.meta.dirname, "github/404.html"),
      },
    },
  },
});
