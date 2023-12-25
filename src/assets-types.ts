import type { DocumentLink, DocumentMeta } from "@builder.io/qwik-city";
import type { PWAOptions } from "./types";

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
  injectDevWebManifestIcons(): Promise<string | undefined>;
  resolveSWPrecachingAssets(): string[];
  checkHotUpdate(path: string): Promise<boolean>;
}
