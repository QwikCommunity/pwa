import type { QwikPWAContext } from "../context";
import { loadConfig, type UserConfig } from "@vite-pwa/assets-generator/config";
import type { AssetsGeneratorContext, ResolvedPWAAsset } from "./types";
import { basename, dirname, relative, resolve } from "node:path";
import { instructions } from "@vite-pwa/assets-generator/api/instructions";
import { readFile } from "node:fs/promises";

async function loadConfiguration(root: string, ctx: QwikPWAContext) {
  if (ctx.options.config === false) {
    return await loadConfig<UserConfig>(root, {
      config: false,
      preset: ctx.options.preset as UserConfig["preset"],
      images: ctx.options.images,
      logLevel: "silent",
    });
  }

  return await loadConfig<UserConfig>(
    root,
    typeof ctx.options.config === "boolean"
      ? root
      : { config: ctx.options.config },
  );
}

export async function loadAssetsGeneratorContext(
  ctx: QwikPWAContext,
  assetContext?: AssetsGeneratorContext,
) {
  const root = ctx.viteConfig.root ?? process.cwd();
  const { config, sources } = await loadConfiguration(root, ctx);
  if (!config.preset) {
    console.error(
      [
        "",
        `Qwik PWA v${ctx.version}`,
        "ERROR: No preset for assets generator found",
      ].join("\n"),
    );
    return;
  }

  const { preset, images, headLinkOptions: userHeadLinkOptions } = config;

  if (!images) {
    console.error(
      [
        "",
        `Qwik PWA v${ctx.version}`,
        "ERROR: No image provided for assets generator",
      ].join("\n"),
    );
    return;
  }

  if (Array.isArray(images)) {
    if (!images.length) {
      console.error(
        [
          "",
          `Qwik PWA v${ctx.version}`,
          "ERROR: No image provided for assets generator",
        ].join("\n"),
      );
      return;
    }
    if (images.length > 1) {
      console.error(
        [
          "",
          `Qwik PWA v${ctx.version}`,
          "ERROR: Only one image is supported for assets generator",
        ].join("\n"),
      );
      return;
    }
  }

  const useImage = Array.isArray(images) ? images[0] : images;
  const imageFile = resolve(root, useImage);
  const publicDir = resolve(root, ctx.viteConfig.publicDir ?? "public");
  const outDir = ctx.clientOutBaseDir;
  const imageName = relative(publicDir, imageFile);
  const imageOutDir = dirname(resolve(outDir, imageName));

  const xhtml = userHeadLinkOptions?.xhtml === true;
  const includeId = userHeadLinkOptions?.includeId === true;
  const assetsInstructions = await instructions({
    imageResolver: () => readFile(resolve(root, useImage)),
    imageName,
    preset,
    faviconPreset: userHeadLinkOptions?.preset,
    htmlLinks: { xhtml, includeId },
    basePath: ctx.basePathRelDir || "/",
    resolveSvgName:
      userHeadLinkOptions?.resolveSvgName ?? ((name) => basename(name)),
  });
  const resolvedWebManifestFile = resolve(
    publicDir,
    ctx.options.webManifestFilename,
  ).replace(/\\/g, "/");
  const {
    includeWebManifest,
    includeHtmlHeadLinks,
    includeThemeColor,
    overrideManifestIcons,
  } = ctx.options;

  if (assetContext === undefined) {
    return {
      lastModified: Date.now(),
      assetsInstructions,
      cache: new Map<string, ResolvedPWAAsset>(),
      useImage,
      imageFile,
      publicDir,
      outDir,
      imageName,
      imageOutDir,
      xhtml,
      includeId,
      // normalize sources
      sources: sources.map((source) => source.replace(/\\/g, "/")),
      includeWebManifest,
      includeThemeColor,
      includeHtmlHeadLinks,
      overrideManifestIcons,
      resolvedWebManifestFile,
    } satisfies AssetsGeneratorContext;
  }

  assetContext.lastModified = Date.now();
  assetContext.assetsInstructions = assetsInstructions;
  assetContext.useImage = useImage;
  assetContext.imageFile = imageFile;
  assetContext.outDir = outDir;
  assetContext.imageName = imageName;
  assetContext.imageOutDir = imageOutDir;
  assetContext.xhtml = xhtml;
  assetContext.includeId = includeId;
  assetContext.includeWebManifest = includeWebManifest;
  assetContext.includeThemeColor = includeThemeColor;
  assetContext.includeHtmlHeadLinks = includeHtmlHeadLinks;
  assetContext.overrideManifestIcons = overrideManifestIcons;
  assetContext.resolvedWebManifestFile = resolvedWebManifestFile;
  assetContext.cache.clear();
}
