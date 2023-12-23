/**
 * PWA assets generation and injection options.
 */
export interface PWAAssets {
  /**
   * PWA assets generation and injection.
   *
   * If `true` the plugin will search for the pwa assets generator configuration file in the root directory of your project:
   * - pwa-assets.config.js
   * - pwa-assets.config.mjs
   * - pwa-assets.config.cjs
   * - pwa-assets.config.ts
   * - pwa-assets.config.cts
   * - pwa-assets.config.mts
   *
   * If using a string path, it should be relative to the root directory of your project.
   *
   * @default true
   * @see https://vite-pwa-org.netlify.app/assets-generator/cli.html#configurations
   */
  path?: true | string;
  /**
   * Should the plugin override the PWA web manifest icons' entry?
   *
   * Ff you provide `true`, this plugin will use `public/manifest.webmanifest`.
   *
   * If you provide a string, it will be used as the path to your web manifest file: it must be a relative path inside the public folder.
   *
   * @default false
   */
  overrideManifestIcons?: boolean;
  /**
   * PWA assets generation and injection options.
   */
  /**
   * Should the plugin include html head links?
   *
   * @default true
   */
  includeHtmlHeadLinks?: boolean;
  /**
   * Should the PWA web manifest `theme_color` be injected in the html head?
   *
   * @default false
   */
  includeThemeColor?: boolean;
  /**
   * Should the plugin include the PWA web manifest in the link?
   *
   * If you provide `true`, this plugin will use `public/manifest.webmanifest`.
   *
   * You can disable this feature by providing `false` or using a custom web manifest name relative to the public folder (for example: `manifest.json`).
   *
   * @default true
   */
  includeWebManifest?: boolean | string;
}

/**
 * PWA options.
 */
export interface PWAOptions {
  /**
   * PWA assets generation and injection options.
   */
  assets?: PWAAssets;
}
