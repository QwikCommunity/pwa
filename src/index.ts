import type { PluginOption, Plugin } from "vite";
import type {
  QwikBuildTarget,
  QwikVitePlugin,
} from "@builder.io/qwik/optimizer";
import type { QwikCityPlugin } from "@builder.io/qwik-city/vite";
import path from "node:path";
import fs from "node:fs/promises";
import fg from "fast-glob";

const tempGenerateFunc: NonNullable<Plugin["generateBundle"]> =
  (() => {}) satisfies Plugin["generateBundle"];
type OutputBundle = Parameters<typeof tempGenerateFunc>[1];

export function qwikPwa(): PluginOption {
  let qwikPlugin: QwikVitePlugin | null = null;
  let qwikCityPlugin: QwikCityPlugin | null = null;
  let publicDir: string | null = null;
  let target: QwikBuildTarget | null = null;

  // make the type an argument of the generateBundle function
  let bundle: OutputBundle;

  let clientOutDir: string;
  let basePathRelDir: string;
  let clientOutBaseDir: string;
  let swClientDistPath: string;

  return [
    {
      name: "qwik-pwa-mutual",
      enforce: "post",
      configResolved(config) {
        qwikPlugin = config.plugins.find(
          (p) => p.name === "vite-plugin-qwik"
        ) as QwikVitePlugin;
        qwikCityPlugin = config.plugins.find(
          (p) => p.name === "vite-plugin-qwik-city"
        ) as QwikCityPlugin;
        target = qwikPlugin!.api.getOptions().target;
        publicDir = config.publicDir;

        clientOutDir = qwikPlugin!.api.getClientOutDir()!;
        basePathRelDir = qwikCityPlugin!.api
          .getBasePathname()
          .replace(/^\/|\/$/, "");
        clientOutBaseDir = path.join(clientOutDir, basePathRelDir);
        swClientDistPath = path.join(clientOutBaseDir, "service-worker.js");
      },
    },
    {
      name: "qwik-pwa-client",
      enforce: "post",
      writeBundle: {
        sequential: true,
        order: "post",
        async handler(_, bundle) {
          if (target !== "client") {
            return;
          }
          const publicDirAssets = await fg.glob("**/*", { cwd: publicDir! });
          // the q-*.js files are going to be handled by qwik itself
          const emittedAssets = Object.keys(bundle).filter(
            (key) => !/.*q-.*\.js$/.test(key)
          );

          const routes = qwikCityPlugin!.api.getRoutes();
          const swCode = await fs.readFile(swClientDistPath, "utf-8");
          const swCodeUpdate = `
        const publicDirAssets = ${JSON.stringify(publicDirAssets)};
        const emittedAssets = ${JSON.stringify(emittedAssets)};
        const routes = [${routes
          .map(
            (route) =>
              `{ pathname: ${JSON.stringify(
                route.pathname
              )}, pattern: new RegExp(${JSON.stringify(route.pattern.source)}),
                hasParams: ${!!route.paramNames.length}
             }`
          )
          .join(",\n")}];
        
        ${swCode}
        `;
          await fs.writeFile(swClientDistPath, swCodeUpdate);
        },
      },
    },
    {
      name: "qwik-pwa-ssr",
      enforce: "post",
      closeBundle: {
        sequential: true,
        order: "post",
        async handler() {
          if (target !== "ssr") {
            return;
          }
          const swCode = await fs.readFile(swClientDistPath, "utf-8");
          const manifest = qwikPlugin!.api.getManifest();
          const swCodeUpdate = `
        const manifestHash = ${JSON.stringify(manifest?.manifestHash)};
        
        ${swCode}
        `;
          await fs.writeFile(swClientDistPath, swCodeUpdate);
        },
      },
    },
  ];
}
