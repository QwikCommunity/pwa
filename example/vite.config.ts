import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { qwikPwa } from "@qwikdev/pwa";

export default defineConfig(() => {
  return {
    define: {
      // enables debugging in workbox
      "process.env.NODE_ENV": JSON.stringify("development"),
    },
    plugins: [qwikCity(), qwikVite(), tsconfigPaths(), qwikPwa()],
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
  };
});
