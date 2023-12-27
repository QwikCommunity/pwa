import type { QwikPWAContext } from "../context";
import { resolve } from "node:path";
import { lstat, readFile, writeFile } from "node:fs/promises";
import type { ImageAssetsInstructions } from "@vite-pwa/assets-generator/api";
import { generateManifestIconsEntry } from "@vite-pwa/assets-generator/api/generate-manifest-icons-entry";
import type { AssetsGeneratorContext } from "./types";

export async function readManifestFile(ctx: QwikPWAContext) {
  return await readWebManifestFile(resolveWebManifestFile(ctx));
}

export async function injectWebManifestEntries(
  ctx: QwikPWAContext,
  manifest: any,
  assetsInstructions: ImageAssetsInstructions,
) {
  if (ctx.options.overrideManifestIcons) {
    manifest.icons = generateManifestIconsEntry(
      "object",
      assetsInstructions,
    ).icons;
  }

  if (!("id" in manifest)) {
    manifest.id = ctx.basePathRelDir || "/";
  }

  if (!("scope" in manifest)) {
    manifest.scope = ctx.basePathRelDir || "/";
  }

  if (!("theme_color" in manifest)) {
    console.warn(
      [
        "",
        `Qwik PWA v${ctx.version}`,
        '"theme_color" is missing from the web manifest, your application will not be able to be installed',
      ].join("\n"),
    );
  }

  return Buffer.from(JSON.stringify(manifest, undefined, 2));
}

export async function writeWebManifest(
  ctx: QwikPWAContext,
  assetContext: AssetsGeneratorContext,
) {
  const manifest = await readManifestFile(ctx);
  if (!manifest) return;

  const buffer = await injectWebManifestEntries(
    ctx,
    manifest,
    assetContext.assetsInstructions,
  );
  await writeFile(
    resolve(ctx.clientOutBaseDir, ctx.options.webManifestFilename),
    buffer,
    "utf-8",
  );
}

export async function overrideWebManifestIcons(manifestFile: string) {
  const manifest = await readWebManifestFile(manifestFile);

  return !!manifest && !("icons" in manifest);
}

function resolveWebManifestFile(ctx: QwikPWAContext) {
  return resolve(ctx.publicDir, ctx.options.webManifestFilename);
}

async function readWebManifestFile(manifestFile: string) {
  const isFile = await lstat(manifestFile)
    .then((stat) => stat.isFile())
    .catch(() => false);
  if (!isFile) return;

  return JSON.parse(await readFile(manifestFile, { encoding: "utf-8" }));
}
