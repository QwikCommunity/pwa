import { injectWebManifestIcons, readManifestFile } from "./manifest";
import type { AssetsGeneratorContext, ResolvedPWAAsset } from "./types";
import type { QwikPWAContext } from "../context";
import { loadAssetsGeneratorContext } from "./config";

export async function findPWAAsset(
  path: string,
  ctx: QwikPWAContext,
  assetsContext: AssetsGeneratorContext,
) {
  let resolved = assetsContext.cache.get(path);
  if (resolved) {
    resolved.age = Date.now() - resolved.lastModified;
    return resolved;
  }

  if (path === ctx.webManifestUrl) {
    const manifest = await readManifestFile(ctx);
    if (!manifest) return;

    resolved = {
      path,
      mimeType: "application/manifest+json",
      buffer: injectWebManifestIcons(
        ctx,
        manifest,
        assetsContext.assetsInstructions,
      ),
      lastModified: Date.now(),
      age: 0,
    } satisfies ResolvedPWAAsset;
    assetsContext.cache.set(path, resolved);
    return resolved;
  }

  const iconAsset =
    assetsContext.assetsInstructions.transparent[path] ??
    assetsContext.assetsInstructions.maskable[path] ??
    assetsContext.assetsInstructions.apple[path] ??
    assetsContext.assetsInstructions.favicon[path] ??
    assetsContext.assetsInstructions.appleSplashScreen[path];

  if (!iconAsset) return;

  if (iconAsset) {
    resolved = {
      path,
      mimeType: iconAsset.mimeType,
      buffer: iconAsset.buffer(),
      lastModified: Date.now(),
      age: 0,
    } satisfies ResolvedPWAAsset;
    assetsContext.cache.set(path, resolved);
    return resolved;
  }
}

export async function checkHotUpdate(
  file: string,
  ctx: QwikPWAContext,
  assetsContext: AssetsGeneratorContext,
) {
  // watch web manifest changes
  if (file === assetsContext.resolvedWebManifestFile) {
    assetsContext.cache.delete(ctx.webManifestUrl);
    return true;
  }

  // watch pwa assets configuration file
  const result = assetsContext.sources.includes(file);
  if (result) await loadAssetsGeneratorContext(ctx, assetsContext);

  return result;
}
