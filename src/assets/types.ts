import type { DocumentLink, DocumentMeta } from "@builder.io/qwik-city";
import type { PWAOptions } from "../types";
import type { ImageAssetsInstructions } from "@vite-pwa/assets-generator/api";

export interface ResolvedPWAAsset {
  path: string;
  mimeType: string;
  buffer: Promise<Buffer>;
  age: number;
  lastModified: number;
}

export interface DevHtmlAssets {
  meta: DocumentMeta[];
  link: DocumentLink[];
}

export interface ResolvedPWAOptions
  extends Required<Omit<PWAOptions, "image">> {
  images: string[];
}

export interface PWAAssetsGenerator {
  generate(): Promise<void>;
  findPWAAsset(path: string): Promise<ResolvedPWAAsset | undefined>;
  resolveHtmlLinks(): Promise<string>;
  resolveDevHtmlAssets(): Promise<DevHtmlAssets>;
  resolveSWPrecachingAssets(): string[];
  checkHotUpdate(
    path: string,
  ): Promise<"webmanifest" | "configuration" | undefined>;
}

export interface AssetsGeneratorContext {
  lastModified: number;
  assetsInstructions: ImageAssetsInstructions;
  cache: Map<string, ResolvedPWAAsset>;
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
  resolvedWebManifestFile: string;
}
