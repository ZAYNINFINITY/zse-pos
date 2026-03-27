import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [
    react({
      include: /\.(jsx|js)$/,
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  esbuild: {
    include: /src\/.*\.(js|jsx)$/,
    loader: "jsx",
    jsx: "automatic",
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".jsx": "jsx",
      },
      jsx: "automatic",
    },
  },
});
