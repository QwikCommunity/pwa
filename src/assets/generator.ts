import type { PWAAssetsGenerator } from "./types";
import type { QwikPWAContext } from "../context";
import { loadAssetsGeneratorContext } from "./config";
import { generate, resolveSWPrecachingAssets } from "./build";
import { checkHotUpdate, findPWAAsset } from "./dev";
import { resolveDevHtmlAssets, resolveHtmlLinks } from "./html";

export async function loadInstructions(ctx: QwikPWAContext) {
  const assetsContext = await loadAssetsGeneratorContext(ctx);
  if (!assetsContext) return;

  return {
    generate: () => generate(ctx, assetsContext),
    resolveSWPrecachingAssets: () => resolveSWPrecachingAssets(assetsContext),
    findPWAAsset: (path: string) => findPWAAsset(path, ctx, assetsContext),
    resolveHtmlLinks: () => resolveHtmlLinks(ctx, assetsContext),
    resolveDevHtmlAssets: () => resolveDevHtmlAssets(ctx, assetsContext),
    checkHotUpdate: (file) => checkHotUpdate(file, ctx, assetsContext),
  } satisfies PWAAssetsGenerator;
}
