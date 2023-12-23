import type { DocumentLink, DocumentMeta } from "@builder.io/qwik-city";

export interface ResolvedIconAsset {
  path: string;
  mimeType: string;
  // eslint-disable-next-line node/prefer-global/buffer
  buffer: Promise<Buffer>;
  age: number;
  lastModified: number;
}

export interface DevHtmlAssets {
  meta: DocumentMeta[];
  link: DocumentLink[];
}

export interface PWAAssetsGenerator {
  generate(): Promise<void>;
  findIconAsset(path: string): Promise<ResolvedIconAsset | undefined>;
  resolveHtmlLinks(hmrEvent: string): Promise<string>;
  resolveDevHtmlAssets(): Promise<DevHtmlAssets>;
  injectManifestIcons: () => Promise<void>;
  /* import('@vite-pwa/assets-generator/api').ImageAssetsInstructions */
  lookupPWAAssetsInstructions(): any;
  checkHotUpdate(path: string): Promise<boolean>;
}
