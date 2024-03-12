import { initializeContext, type QwikPWAContext } from "../context";
import type { Plugin } from "vite";

const VIRTUAL_CLIENT_MODE = "virtual:qwik-pwa/client-mode";
const RESOLVED_VIRTUAL_CLIENT_MODE = `\0${VIRTUAL_CLIENT_MODE}`;

export default function MainPlugin(ctx: QwikPWAContext): Plugin {
  return {
    name: "qwik-pwa:main",
    enforce: "pre",
    configResolved(config) {
      initializeContext(ctx, config);
    },
    resolveId(id) {
      if (id === VIRTUAL_CLIENT_MODE) return RESOLVED_VIRTUAL_CLIENT_MODE;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_CLIENT_MODE) {
        return `export const promptForUpdate = ${
          ctx.userOptions.promptForUpdate === true
        };`;
      }
    },
  };
}
