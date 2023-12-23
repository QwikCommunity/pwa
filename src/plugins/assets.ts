import type { QwikPWAContext } from "../context";
import type { Plugin } from "vite";
// import fs from "node:fs/promises";
// import { join } from "node:path";
// import { fileURLToPath } from "node:url";
// import type { DocumentLink } from "@builder.io/qwik-city";

const VIRTUAL = "virtual:qwik-pwa/head";
const RESOLVED_VIRTUAL = `\0${VIRTUAL}`;
const DEV_RELOAD_PAGE_NAME = "qwik-pwa:reload-page";

export default function AssetsPlugin(ctx: QwikPWAContext): Plugin {
  return {
    name: "qwik-pwa:assets",
    enforce: "post",
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED_VIRTUAL : undefined;
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL) {
        const assets = await ctx.assets;
        return (
          assets?.resolveHtmlLinks(DEV_RELOAD_PAGE_NAME) ??
          `export const link = [];
export const meta = [];
`
        );
      }
    },
    async handleHotUpdate({ file, server }) {
      const assetsGenerator = await ctx.assets;
      if (await assetsGenerator?.checkHotUpdate(file)) {
        server.ws.send({
          type: "custom",
          event: DEV_RELOAD_PAGE_NAME,
        });
        return [];
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url;
        if (!url) return next();

        if (!/\.(ico|png|svg|webp)$/.test(url)) return next();

        const assetsGenerator = await ctx.assets;
        if (!assetsGenerator) return next();

        const icon = await assetsGenerator.findIconAsset(url);
        if (!icon) return next();

        if (icon.age > 0) {
          const ifModifiedSince =
            req.headers["if-modified-since"] ??
            req.headers["If-Modified-Since"];
          const useIfModifiedSince = ifModifiedSince
            ? Array.isArray(ifModifiedSince)
              ? ifModifiedSince[0]
              : ifModifiedSince
            : undefined;
          if (
            useIfModifiedSince &&
            new Date(icon.lastModified).getTime() / 1000 >=
              new Date(useIfModifiedSince).getTime() / 1000
          ) {
            res.statusCode = 304;
            res.end();
            return;
          }
        }

        const buffer = await icon.buffer;
        res.setHeader("Age", icon.age / 1000);
        res.setHeader("Content-Type", icon.mimeType);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader(
          "Last-Modified",
          new Date(icon.lastModified).toUTCString(),
        );
        res.statusCode = 200;
        res.end(buffer);
      });
    },
    closeBundle: {
      sequential: true,
      order: "post",
      async handler() {
        if (ctx.target !== "client") {
          return;
        }
        const assets = await ctx.assets;
        if (!assets) return;

        await assets.generate();

        /*await generateAssets(iconsInstructions, true, ctx.clientOutBaseDir);
        const webManifestPath = path.resolve(
          ctx.clientOutBaseDir,
          "manifest.json",
        );
        const webManifest: Record<string, any> = JSON.parse(
          await fs.readFile(webManifestPath, { encoding: "utf-8" }),
        );
        Object.assign(
          webManifest,
          generateManifestIconsEntry("object", iconsInstructions),
        );
        webManifest.orientation = options.orientation;
        await fs.writeFile(
          webManifestPath,
          JSON.stringify(webManifest, undefined, 2),
        );*/
      },
    },
  };
}
