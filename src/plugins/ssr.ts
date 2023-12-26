import fs from "node:fs/promises";
import type { QwikPWAContext } from "../context";
import type { Plugin } from "vite";

export default function SSRPlugin(ctx: QwikPWAContext): Plugin {
  return {
    name: "qwik-pwa:ssr",
    enforce: "post",
    closeBundle: {
      sequential: true,
      order: "post",
      async handler() {
        if (ctx.target !== "ssr") {
          return;
        }
        const swCode = await fs.readFile(ctx.swClientDistPath, "utf-8");
        const manifest = ctx.qwikPlugin.api.getManifest();
        const swCodeUpdate = `
        const manifestHash = ${JSON.stringify(manifest?.manifestHash)};
        
        ${swCode}
        `;
        await fs.writeFile(ctx.swClientDistPath, swCodeUpdate);
      },
    },
  };
}
