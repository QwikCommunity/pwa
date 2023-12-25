import type { DocumentLink, DocumentMeta } from "@builder.io/qwik-city";
import type { PWAOptions } from "./types";
import type { AssetsContext } from "./assets-generator";

export interface ResolvedIconAsset {
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
  assetsContext: AssetsContext;
  generate(): Promise<void>;
  findIconAsset(path: string): Promise<ResolvedIconAsset | undefined>;
  resolveHtmlLinks(wsEvent: string): Promise<string>;
  resolveDevHtmlAssets(): Promise<DevHtmlAssets>;
  injectDevWebManifestIcons(): Promise<void>;
  checkHotUpdate(path: string): Promise<boolean>;
}
