import {defineConfig} from "vite";

import {fileURLToPath} from "node:url";

const packages = fileURLToPath(new URL("../../packages/", import.meta.url));

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: [
      {find: /^@whuiy\/dom$/, replacement: packages + "dom/src/index.ts"},
      {find: /^whuiy\/primitives$/, replacement: packages + "core/src/primitives.ts"},
      {find: /^whuiy$/, replacement: packages + "core/src/index.ts"},
    ],
  },
});
