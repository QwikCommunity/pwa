import { initializeContext, type QwikPWAContext } from "../context";
import type { Plugin } from "vite";

export default function MainPlugin(ctx: QwikPWAContext): Plugin {
  return {
    name: "qwik-pwa:main",
    enforce: "pre",
    configResolved(config) {
      initializeContext(ctx, config);
    },
  };
}
