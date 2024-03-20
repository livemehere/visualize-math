import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "https://livemehere.github.io/visualize-math/",
  plugins: [react()],
});
