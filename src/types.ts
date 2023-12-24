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
   * Should the plugin override the PWA web manifest icons' entry?
   *
   * @default false
   */
  overrideManifestIcons?: boolean;
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
   * Should the plugin include the PWA web manifest in the link?
   *
   * If you provide `true`, this plugin will use `public/manifest.json`.
   *
   * If you provide a string, it will be used as the path to your web manifest file: it must be a relative path inside the public folder.
   *
   * @default true
   */
  includeWebManifest?: boolean | string;
}
