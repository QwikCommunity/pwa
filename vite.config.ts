import { defineConfig } from "vite";
import pkg from "./package.json";
// add this to the template of qwik lib because some imports are not node:stream and instead they're stream
import { builtinModules } from "node:module";
import { qwikVite } from "@builder.io/qwik/optimizer";
import tsconfigPaths from "vite-tsconfig-paths";

const { dependencies = {}, peerDependencies = {} } = pkg as any;
const makeRegex = (dep: string) => new RegExp(`^${dep}(/.*)?$`);
const excludeAll = (obj: any) => Object.keys(obj).map(makeRegex);

export default defineConfig({
  build: {
    target: "es2020",
    lib: {
      entry: [
        "./src/index.ts",
        "./src/sw.ts",
        "./src/head.ts",
        "./src/prompt-for-update.ts",
      ],
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.qwik.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      // externalize deps that shouldn't be bundled into the library
      external: [
        "fast-glob",
        "virtual:qwik-pwa/head",
        "virtual:qwik-pwa/client-mode",
        ...excludeAll(builtinModules),
        ...builtinModules,
        /^node:.*/,
        ...excludeAll(dependencies),
        ...excludeAll(peerDependencies),
      ],
    },
  },
  plugins: [qwikVite(), tsconfigPaths()],
});
