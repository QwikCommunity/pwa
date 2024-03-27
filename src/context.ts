import type {
  QwikBuildTarget,
  QwikVitePlugin,
} from "@builder.io/qwik/optimizer";
import type { QwikCityPlugin } from "@builder.io/qwik-city/vite";
import type { PWAAssetsGenerator, ResolvedPWAOptions } from "./assets/types";
import type { ResolvedConfig } from "vite";
import type { PWAOptions } from "./types";
import { version } from "../package.json";
import { join } from "node:path";
import { resolveOptions } from "./assets/options";

export interface QwikPWAContext {
  version: string;
  userOptions: PWAOptions;
  webManifestUrl: string;
  options: ResolvedPWAOptions;
  viteConfig: ResolvedConfig;
  qwikPlugin: QwikVitePlugin;
  qwikCityPlugin: QwikCityPlugin;
  publicDir: string;
  target: QwikBuildTarget;
  clientOutDir: string;
  basePathRelDir: string;
  clientOutBaseDir: string;
  swClientDistPath: string;
  assets: Promise<PWAAssetsGenerator | undefined>;
}

export function createContext(options: PWAOptions): QwikPWAContext {
  return {
    version,
    userOptions: options,
    webManifestUrl: undefined!,
    options: undefined!,
    viteConfig: undefined!,
    publicDir: undefined!,
    qwikPlugin: undefined!,
    qwikCityPlugin: undefined!,
    target: undefined!,
    clientOutDir: undefined!,
    basePathRelDir: undefined!,
    clientOutBaseDir: undefined!,
    swClientDistPath: undefined!,
    assets: Promise.resolve(undefined),
  };
}

export function initializeContext(
  ctx: QwikPWAContext,
  viteConfig: ResolvedConfig,
) {
  ctx.viteConfig = viteConfig;
  ctx.qwikPlugin = viteConfig.plugins.find(
    (p) => p.name === "vite-plugin-qwik",
  ) as QwikVitePlugin;
  ctx.qwikCityPlugin = viteConfig.plugins.find(
    (p) => p.name === "vite-plugin-qwik-city",
  ) as QwikCityPlugin;
  ctx.target = ctx.qwikPlugin!.api.getOptions().target;
  ctx.publicDir = viteConfig.publicDir || "public";
  ctx.clientOutDir = viteConfig.build.outDir || ctx.qwikPlugin!.api.getClientOutDir()!;
  ctx.basePathRelDir = ctx
    .qwikCityPlugin!.api.getBasePathname()
    .replace(/^\/|\/$/, "");
  ctx.clientOutBaseDir = join(ctx.clientOutDir, ctx.basePathRelDir);
  ctx.swClientDistPath = join(ctx.clientOutBaseDir, "service-worker.js");
  if (ctx.userOptions.config || ctx.userOptions.preset) {
    resolveOptions(ctx);
    ctx.assets = import("./assets/generator")
      .then(({ loadInstructions }) => loadInstructions(ctx))
      .catch((e) => {
        console.error(["", `Qwik PWA v${ctx.version}`].join("\n"), e);
        return Promise.resolve(undefined);
      });
  }
}
