import type { AssetsGeneratorContext, DevHtmlAssets } from "./types";
import { readManifestFile } from "./manifest";
import { mapLink } from "./utils";
import type { QwikPWAContext } from "../context";

export async function resolveDevHtmlAssets(
  ctx: QwikPWAContext,
  assetsContext: AssetsGeneratorContext,
) {
  const header: DevHtmlAssets = {
    link: [],
    meta: [],
  };
  if (assetsContext.includeThemeColor) {
    const manifest = await readManifestFile(ctx);
    if (manifest && "theme_color" in manifest)
      header.meta.push({
        key: "theme-color",
        content: manifest.theme_color,
        name: "theme-color",
      });
  }

  if (assetsContext.includeWebManifest) {
    header.link.push({
      key: "manifest",
      rel: "manifest",
      href: ctx.webManifestUrl,
    });
  }

  if (assetsContext.includeHtmlHeadLinks) {
    const instruction = assetsContext.assetsInstructions;
    const apple = Array.from(Object.values(instruction.apple));
    const favicon = Array.from(Object.values(instruction.favicon));
    const appleSplashScreen = Array.from(
      Object.values(instruction.appleSplashScreen),
    );
    const includeId = assetsContext.includeId;
    favicon.forEach(
      (icon) =>
        icon.linkObject &&
        header.link.push(mapLink(includeId, icon.linkObject)),
    );
    apple.forEach(
      (icon) =>
        icon.linkObject &&
        header.link.push(mapLink(includeId, icon.linkObject)),
    );
    appleSplashScreen.forEach(
      (icon) =>
        icon.linkObject &&
        header.link.push(mapLink(includeId, icon.linkObject)),
    );
  }

  return header;
}

export async function resolveHtmlLinks(
  ctx: QwikPWAContext,
  assetsContext: AssetsGeneratorContext,
) {
  const header = await resolveDevHtmlAssets(ctx, assetsContext);
  return `export const links = ${JSON.stringify(header.link)};
export const meta = ${JSON.stringify(header.meta)};
`;
}
