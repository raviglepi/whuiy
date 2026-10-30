import {defineConfig, configDefaults} from "vitest/config";

import {comptime} from "comptime/vite";

export default defineConfig({
  plugins: [comptime()],
  test: {
    exclude: [...configDefaults.exclude, "bun.test.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          exclude: ["**/*.bench.ts"],
          include: ["core/test/**/*.test.ts", "react/test/**/*.test.ts*"],
        },
      },
      {
        extends: true,
        test: {name: "dom", environment: "happy-dom", include: ["dom/test/**/*.test.ts"]},
      },
    ],
  },
});
