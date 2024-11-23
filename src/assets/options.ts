import type { QwikPWAContext } from "../context";

export function resolveOptions(ctx: QwikPWAContext) {
  // don't use ?? in ctx.basePathRelDir because it can be an empty string
  ctx.webManifestUrl = `${ctx.basePathRelDir || "/"}${
    ctx.userOptions.webManifestFilename ?? "manifest.json"
  }`;

  const {
    config = false,
    preset = "minimal-2023",
    overrideAssets = true,
    image = "public/favicon.svg",
    htmlPreset = "2023",
    webManifestFilename = "manifest.json",
    overrideManifestIcons = true,
    includeHtmlHeadLinks = true,
    includeThemeColor = true,
    includeWebManifest = false,
  } = ctx.userOptions;

  ctx.options = {
    config,
    preset: config ? false : preset,
    overrideAssets,
    images: [image],
    htmlPreset,
    webManifestFilename: webManifestFilename,
    overrideManifestIcons,
    includeHtmlHeadLinks,
    includeThemeColor,
    includeWebManifest,
    excludeRoutes: [],
  };
}
