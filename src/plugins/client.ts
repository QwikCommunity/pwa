import fg from "fast-glob";
import fs from "node:fs/promises";
import type { QwikPWAContext } from "../context";
import type { Plugin } from "vite";
import { ImageAssetsInstructions } from "@vite-pwa/assets-generator/api";

export default function ClientPlugin(ctx: QwikPWAContext): Plugin {
  return {
    name: "qwik-pwa:client",
    enforce: "post",
    writeBundle: {
      sequential: true,
      order: "post",
      async handler(_, bundle) {
        if (ctx.target !== "client") {
          return;
        }
        const publicDirAssets = await fg.glob("**/*", { cwd: ctx.publicDir });
        // the q-*.js files are going to be handled by qwik itself
        const emittedAssets = Object.keys(bundle).filter(
          (key) => !/.*q-.*\.js$/.test(key),
        );
        const assets = await ctx.assets;
        const generatedAssetsUrls = assets?.resolveSWPrecachingAssets() ?? [];
        const routes = ctx.qwikCityPlugin.api.getRoutes();
        const swCode = await fs.readFile(ctx.swClientDistPath, "utf-8");
        const swCodeUpdate = `
        const publicDirAssets = ${JSON.stringify(publicDirAssets)};
        const emittedAssets = ${JSON.stringify([
          ...generatedAssetsUrls,
          ...emittedAssets,
        ])};
        const routes = [${routes
          .map(
            (route) =>
              `{ pathname: ${JSON.stringify(
                route.pathname,
              )}, pattern: new RegExp(${JSON.stringify(route.pattern.source)}),
                hasParams: ${!!route.paramNames.length}
             }`,
          )
          .join(",\n")}];
        
        ${swCode}
        `;
        await fs.writeFile(ctx.swClientDistPath, swCodeUpdate);
      },
    },
  };
}
