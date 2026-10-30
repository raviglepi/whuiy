import {defineConfig} from "vite";

import {comptime} from "comptime/vite";

export default defineConfig({
  plugins: [comptime()],
  build: {lib: {entry: "src/index.ts", formats: ["es", "cjs"]}},
});
