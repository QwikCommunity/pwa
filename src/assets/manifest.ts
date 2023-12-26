import type { QwikPWAContext } from "../context";
import { resolve } from "node:path";
import { lstat, readFile, writeFile } from "node:fs/promises";
import type { ImageAssetsInstructions } from "@vite-pwa/assets-generator/api";
import { generateManifestIconsEntry } from "@vite-pwa/assets-generator/api/generate-manifest-icons-entry";
import type { AssetsGeneratorContext } from "./types";

export async function readManifestFile({
  options,
  viteConfig,
}: QwikPWAContext) {
  const manifestFile = resolve(
    viteConfig.publicDir ?? "public",
    options.webManifestFilename,
  );
  const isFile = await lstat(manifestFile)
    .then((stat) => stat.isFile())
    .catch(() => false);
  if (!isFile) return;

  return {
    manifestFile,
    manifest: await readFile(manifestFile, { encoding: "utf-8" }).then(
      JSON.parse,
    ),
  };
}

export async function injectWebManifestIcons(
  manifest: any,
  assetsInstructions: ImageAssetsInstructions,
) {
  const icons = generateManifestIconsEntry("object", assetsInstructions).icons;
  return Buffer.from(
    JSON.stringify(Object.assign(manifest.manifest, { icons }), undefined, 2),
  );
}

export async function writeWebManifest(
  ctx: QwikPWAContext,
  assetContext: AssetsGeneratorContext,
) {
  if (!ctx.options.overrideManifestIcons) return;
  const manifest = await readManifestFile(ctx);
  if (!manifest) return;
  const buffer = await injectWebManifestIcons(
    manifest,
    assetContext.assetsInstructions,
  );

  await writeFile(
    resolve(ctx.clientOutBaseDir, ctx.options.webManifestFilename),
    buffer,
    "utf-8",
  );
}
