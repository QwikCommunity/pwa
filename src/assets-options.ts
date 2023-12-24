import { QwikPWAContext } from "./context";

export function resolveOptions(ctx: QwikPWAContext) {
  const {
    config = false,
    preset = "minimal-2023",
    overrideAssets = true,
    image = "public/favicon.svg",
    htmlPreset = "2023",
    overrideManifestIcons = false,
    includeHtmlHeadLinks = true,
    includeThemeColor = true,
    includeWebManifest = true,
  } = ctx.userOptions;

  ctx.options = {
    config,
    preset: config ? false : preset,
    overrideAssets,
    images: [image],
    htmlPreset,
    overrideManifestIcons,
    includeHtmlHeadLinks,
    includeThemeColor,
    includeWebManifest,
  };
}
