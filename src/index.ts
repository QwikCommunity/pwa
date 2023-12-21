import type { PluginOption } from "vite";
import type {
  QwikBuildTarget,
  QwikVitePlugin,
} from "@builder.io/qwik/optimizer";
import type { DocumentLink } from "@builder.io/qwik-city";
import type { QwikCityPlugin } from "@builder.io/qwik-city/vite";
import path, { basename } from "node:path";
import fs from "node:fs/promises";
import fg from "fast-glob";
import { ImageAssetsInstructions } from "@vite-pwa/assets-generator/api";
import { instructions } from "@vite-pwa/assets-generator/api/instructions";
import { generateAssets } from "@vite-pwa/assets-generator/api/generate-assets";
import { generateHtmlMarkup } from "@vite-pwa/assets-generator/api/generate-html-markup";
import { generateManifestIconsEntry } from "@vite-pwa/assets-generator/api/generate-manifest-icons-entry";
import { fileURLToPath } from "node:url";
import { ELEMENT_NODE, parse, walk } from "ultrahtml";

type Orientation =
  | "any"
  | "natural"
  | "landscape"
  | "landscape-primary"
  | "landscape-secondary"
  | "portrait"
  | "portrait-primary"
  | "portrait-secondary";

type Options = {
  /** @default "portrait" */
  orientation: Orientation;
  /** @default "./public/favicon.svg" */
  icon: string;
};

export function qwikPwa(
  options: Options = { icon: "./public/favicon.svg", orientation: "portrait" }
): PluginOption {
  let qwikPlugin: QwikVitePlugin | null = null;
  let qwikCityPlugin: QwikCityPlugin | null = null;
  let publicDir: string | null = null;
  let target: QwikBuildTarget | null = null;

  let clientOutDir: string;
  let basePathRelDir: string;
  let clientOutBaseDir: string;
  let swClientDistPath: string;
  let iconsInstructions: ImageAssetsInstructions;

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
    {
      name: "qwik-pwa-assets",
      enforce: "post",
      async configResolved() {
        iconsInstructions = await instructions({
          preset: "minimal-2023",
          basePath: basePathRelDir,
          imageResolver: () => fs.readFile(options.icon),
          resolveSvgName: (name) => basename(name),
          htmlLinks: {
            xhtml: false,
            includeId: false,
          },
          imageName: options.icon,
        });
      },
      async load(id) {
        const thisFile = fileURLToPath(import.meta.url);
        const iconsEntryPath = path.join(thisFile, "../icons-entry.qwik");

        if (id.startsWith(iconsEntryPath)) {
          const ast = parse(generateHtmlMarkup(iconsInstructions).join(""));
          const links: DocumentLink[] = [];
          await walk(ast, async (node) => {
            if (node.type === ELEMENT_NODE && node.name === "link") {
              links.push({ ...node.attributes, key: node.attributes.href });
            }
          });
          return `export default ${JSON.stringify(links)}`;
        }
      },
      closeBundle: {
        sequential: true,
        order: "post",
        async handler() {
          if (target !== "client") {
            return;
          }
          await generateAssets(iconsInstructions, true, clientOutBaseDir);
          const webManifestPath = path.resolve(
            clientOutBaseDir,
            "manifest.json"
          );
          const webManifest: Record<string, any> = JSON.parse(
            await fs.readFile(webManifestPath, { encoding: "utf-8" })
          );
          Object.assign(
            webManifest,
            generateManifestIconsEntry("object", iconsInstructions)
          );
          webManifest.orientation = options.orientation;
          await fs.writeFile(
            webManifestPath,
            JSON.stringify(webManifest, undefined, 2)
          );
        },
      },
    },
  ];
}
