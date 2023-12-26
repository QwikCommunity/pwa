import type { BuiltInPreset, Preset } from "@vite-pwa/assets-generator/config";
import type { HtmlLinkPreset } from "@vite-pwa/assets-generator/api";

/**
 * Qwik PWA options.
 */
export interface PWAOptions {
  /**
   * PWA assets generation and injection.
   *
   * By default, the plugin will search for the pwa assets generator configuration file in the root directory of your project:
   * - pwa-assets.config.js
   * - pwa-assets.config.mjs
   * - pwa-assets.config.cjs
   * - pwa-assets.config.ts
   * - pwa-assets.config.cts
   * - pwa-assets.config.mts
   *
   * If using a string path, it should be relative to the root directory of your project.
   *
   * Setting to `false` will disable config resolving.
   *
   * @default false
   * @see https://vite-pwa-org.netlify.app/assets-generator/cli.html#configurations
   */
  config?: string | boolean;
  /**
   * Preset to use.
   *
   * If `config` option is enabled, this option will be ignored.
   *
   * Setting to `false` will disable PWA assets generation if `config` option disabled.
   *
   * @default 'minimal-2023'
   */
  preset?: false | BuiltInPreset | Preset;
  /**
   * Override assets?
   *
   * @default true
   */
  overrideAssets?: boolean;
  /**
   * Path relative to `root` folder where to find the image to use for generating PWA assets.
   *
   * @default `public/favicon.svg`
   */
  image?: string;
  /**
   * The preset to use for head links (favicon links).
   *
   * @see https://vite-pwa-org.netlify.app/assets-generator/#preset-minimal-2023
   * @see https://vite-pwa-org.netlify.app/assets-generator/#preset-minimal
   * @default '2023'
   */
  htmlPreset?: HtmlLinkPreset;
  /**
   * Should the plugin include html head links?
   *
   * @default true
   */
  includeHtmlHeadLinks?: boolean;
  /**
   * Should the PWA web manifest `theme_color` be injected in the html head when present?
   *
   * @default true
   */
  includeThemeColor?: boolean;
  /**
   * The name of the web manifest file located in the Vite's `publicDir` folder (defaults to `public` folder).
   *
   * @default 'manifest.json'
   */
  webManifestFilename?: string;
  /**
   * Should the plugin override the PWA web manifest icons' entry?
   *
   * If you rename the `public/manifest.json` file, remember to update `webManifestFilename` option.
   *
   * With this option enabled, the plugin will add the icons entry to your web manifest file.
   *
   * If your web manifest file already contains the icons entry, the plugin will ignore this option.
   *
   * @default true
   */
  overrideManifestIcons?: boolean;
  /**
   * Should the plugin include the PWA web manifest in the head links?
   *
   * If you enable this option, remember to remove `<link rel="manifest" href="/manifest.json" />` from `src/root.tsx` component.
   *
   * @default false
   */
  includeWebManifest?: boolean;
}
