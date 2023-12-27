import type { QwikPWAContext } from "../context";
import type { Plugin } from "vite";

const VIRTUAL = "virtual:qwik-pwa/head";
const RESOLVED_VIRTUAL = `\0${VIRTUAL}`;

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
          (await assets?.resolveHtmlLinks()) ??
          `export const links = [];
export const meta = [];
`
        );
      }
    },
    buildStart() {
      // add web manifest to watcher, and so we can reload the page when it changes
      this.addWatchFile(ctx.webManifestUrl);
    },
    async handleHotUpdate({ file, server }) {
      const assetsGenerator = await ctx.assets;
      // will handle web manifest and pwa assets generator config files changes
      if (await assetsGenerator?.checkHotUpdate(file)) {
        // send full page reload to load new assets
        server.ws.send({ type: "full-reload" });
        return [];
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url;
        if (!url) return next();

        // early return if not a pwa asset
        if (url !== ctx.webManifestUrl && !/\.(ico|png|svg|webp)$/.test(url))
          return next();

        const assetsGenerator = await ctx.assets;
        if (!assetsGenerator) return next();

        // will handle pwa icons and web manifest (only when pwa icons injection enabled)
        const asset = await assetsGenerator.findPWAAsset(url);
        if (!asset) return next();

        if (asset.age > 0) {
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
            new Date(asset.lastModified).getTime() / 1000 >=
              new Date(useIfModifiedSince).getTime() / 1000
          ) {
            res.statusCode = 304;
            res.end();
            return;
          }
        }

        const buffer = await asset.buffer;
        res.setHeader("Age", asset.age / 1000);
        res.setHeader("Content-Type", asset.mimeType);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader(
          "Last-Modified",
          new Date(asset.lastModified).toUTCString(),
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
      },
    },
  };
}
