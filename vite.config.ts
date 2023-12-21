import { defineConfig } from "vite";
import pkg from "./package.json";
// add this to the template of qwik lib because some imports are not node:stream and instead they're stream
import { builtinModules } from "node:module";
// import { qwikVite } from "@builder.io/qwik/optimizer";
// import tsconfigPaths from "vite-tsconfig-paths";

const { dependencies = {}, peerDependencies = {} } = pkg as any;
const makeRegex = (dep) => new RegExp(`^${dep}(/.*)?$`);
const excludeAll = (obj) => Object.keys(obj).map(makeRegex);

export default defineConfig({
  build: {
    target: "es2020",
    lib: {
      entry: ["./src/index.ts", "./src/sw.ts", "./src/icons-entry.ts"],
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.qwik.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // externalize deps that shouldn't be bundled into the library
      external: [
        "fast-glob",
        ...excludeAll(builtinModules),
        ...builtinModules,
        /^node:.*/,
        ...excludeAll(dependencies),
        ...excludeAll(peerDependencies),
      ],
    },
  },
  plugins: [],
});
