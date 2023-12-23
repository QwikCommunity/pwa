import type {
  DevHtmlAssets,
  PWAAssetsGenerator,
  ResolvedIconAsset,
} from "./assets-types";
import type { UserConfig } from "@vite-pwa/assets-generator/config";
import { loadConfig } from "@vite-pwa/assets-generator/config";
import { instructions } from "@vite-pwa/assets-generator/api/instructions";
import { generateAssets } from "@vite-pwa/assets-generator/api/generate-assets";
import { generateManifestIconsEntry } from "@vite-pwa/assets-generator/api/generate-manifest-icons-entry";
import { version } from "../package.json";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import type {
  AppleSplashScreenLink,
  FaviconLink,
  HtmlLink,
  ImageAssetsInstructions,
} from "@vite-pwa/assets-generator/api";
import { QwikPWAContext } from "./context";
import { DocumentLink } from "@builder.io/qwik-city";

interface AssetsGeneratorContext {
  lastModified: number;
  assetsInstructions: ImageAssetsInstructions;
  cache: Map<string, ResolvedIconAsset>;
  useImage: string;
  imageFile: string;
  publicDir: string;
  outDir: string;
  imageName: string;
  imageOutDir: string;
  xhtml: boolean;
  includeId: boolean;
  sources: string[];
  includeWebManifest: boolean | string;
  includeThemeColor: boolean;
  includeHtmlHeadLinks: boolean;
  overrideManifestIcons: boolean;
}

export async function loadInstructions(ctx: QwikPWAContext) {
  const assetsContext = await loadAssetsGeneratorContext(ctx);
  if (!assetsContext) return;

  const mapLink = (link: HtmlLink | FaviconLink | AppleSplashScreenLink) => {
    const entry: DocumentLink = {
      key: link.href,
    };
    if (assetsContext.includeId && link.id) entry.id = link.id;

    entry.rel = link.rel;

    if ("media" in link && link.media) entry.media = link.media;

    entry.href = link.href;

    if ("sizes" in link && link.sizes) entry.sizes = link.sizes;

    if ("type" in link && link.type) entry.type = link.type;

    return entry;
  };

  return {
    async generate() {
      await mkdir(assetsContext.imageOutDir, { recursive: true });
      const promise = generateAssets(
        assetsContext.assetsInstructions,
        true,
        assetsContext.imageOutDir,
      );
      if (ctx.options.assets!.overrideManifestIcons) {
        await Promise.all([
          promise,
          readManifestFile(ctx).then((manifest) => {
            if (manifest) {
              manifest.manifest.icons = generateManifestIconsEntry(
                "object",
                assetsContext.assetsInstructions,
              ).icons;
              return writeFile(
                manifest.manifestFile,
                JSON.stringify(manifest.manifest, undefined, 2),
                "utf-8",
              );
            }

            return Promise.resolve();
          }),
        ]);
      } else {
        await promise;
      }
    },
    async findIconAsset(path: string) {
      let resolved = assetsContext.cache.get(path);
      if (resolved) {
        resolved.age = Date.now() - resolved.lastModified;
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
          lastModified: assetsContext.lastModified,
          age: 0,
        } satisfies ResolvedIconAsset;
        assetsContext.cache.set(path, resolved);
        return resolved;
      }
    },
    async resolveHtmlLinks(event: string) {
      const header = await this.resolveDevHtmlAssets();
      return `export const link = ${JSON.stringify(header.link)};
export const meta = ${JSON.stringify(header.meta)};
if (import.meta.hot) {
  import.meta.hot.on('${event}', () => {
    window.location.reload();
  });  
}            
`;
    },
    async resolveDevHtmlAssets() {
      const header: DevHtmlAssets = {
        link: [],
        meta: [],
      };
      if (assetsContext.includeThemeColor) {
        const manifest = await readManifestFile(ctx);
        if (manifest && "theme_color" in manifest.manifest)
          header.meta.push({
            key: "theme-color",
            content: manifest.manifest.theme_color,
            name: "theme-color",
          });
      }

      if (assetsContext.includeWebManifest) {
        const href =
          typeof ctx.options.assets!.includeWebManifest === "string"
            ? ctx.options.assets!.includeWebManifest
            : "manifest.webmanifest";
        header.link.push({
          key: "manifest",
          rel: "manifest",
          href: `${ctx.basePathRelDir || "/"}${href}`,
        });
      }

      if (assetsContext.includeHtmlHeadLinks) {
        const instruction = assetsContext.assetsInstructions;
        const apple = Array.from(Object.values(instruction.apple));
        const favicon = Array.from(Object.values(instruction.favicon));
        const appleSplashScreen = Array.from(
          Object.values(instruction.appleSplashScreen),
        );
        favicon.forEach(
          (icon) =>
            icon.linkObject && header.link.push(mapLink(icon.linkObject)),
        );
        apple.forEach(
          (icon) =>
            icon.linkObject && header.link.push(mapLink(icon.linkObject)),
        );
        appleSplashScreen.forEach(
          (icon) =>
            icon.linkObject && header.link.push(mapLink(icon.linkObject)),
        );
      }

      return header;
    },
    async injectManifestIcons() {
      /*
      if (!assetsContext.overrideManifestIcons) return;

      const manifest = await readManifestFile(viteConfig, options);
      if (manifest) {
        manifest.icons = generateManifestIconsEntry(
          "object",
          assetsContext.assetsInstructions,
        ).icons;
      }
*/
    },
    lookupPWAAssetsInstructions() {
      return assetsContext.assetsInstructions;
    },
    async checkHotUpdate(file) {
      const result = assetsContext.sources.includes(file);
      if (result) await loadAssetsGeneratorContext(ctx, assetsContext);

      return result;
    },
  } satisfies PWAAssetsGenerator;
}

async function loadAssetsGeneratorContext(
  ctx: QwikPWAContext,
  assetContext?: AssetsGeneratorContext,
) {
  const root = ctx.viteConfig.root ?? process.cwd();
  const { config, sources } = await loadConfig<UserConfig>(
    root,
    typeof ctx.options.assets!.path === "boolean"
      ? root
      : { config: ctx.options.assets!.path },
  );
  if (!config.preset) {
    console.error(
      [
        "",
        `Qwik PWA v${version}`,
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
        `Qwik PWA v${version}`,
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
          `Qwik PWA v${version}`,
          "ERROR: No image provided for assets generator",
        ].join("\n"),
      );
      return;
    }
    if (images.length > 1) {
      console.error(
        [
          "",
          `Qwik PWA v${version}`,
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
  const {
    includeWebManifest = true,
    includeHtmlHeadLinks = true,
    includeThemeColor = false,
    overrideManifestIcons = false,
  } = ctx.options.assets!;

  if (assetContext === undefined) {
    return {
      lastModified: Date.now(),
      assetsInstructions,
      cache: new Map<string, ResolvedIconAsset>(),
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
  assetContext.cache.clear();
}

async function readManifestFile({ options, viteConfig }: QwikPWAContext) {
  if (
    !options.assets!.overrideManifestIcons ||
    !options.assets!.includeWebManifest
  )
    return;

  const name =
    typeof options.assets!.includeWebManifest === "string"
      ? options.assets!.includeWebManifest
      : "manifest.webmanifest";

  const manifestFile = resolve(viteConfig.publicDir ?? "public", name);
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
