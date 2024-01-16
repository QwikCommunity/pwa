import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { type PWAOptions, qwikPwa } from "@qwikdev/pwa";

const promptForUpdate = process.env.PROMPT === "true";

const config: PWAOptions | undefined = process.env.CUSTOM_CONFIG === "true"
 ? { config: true, promptForUpdate }
    : { config: false, promptForUpdate, preset: "minimal-2023" };

export default defineConfig(() => {
  return {
    mode: "development",
    define: {
      // enables debugging in workbox
      "process.env.NODE_ENV": JSON.stringify("development"),
    },
    plugins: [
      qwikCity(),
      qwikVite(),
      tsconfigPaths(),
      qwikPwa(config)
    ],
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
  };
});
