import type { PrecacheEntry } from "workbox-precaching";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { StaleWhileRevalidate, NetworkFirst } from "workbox-strategies";

import {
  NavigationRoute,
  registerRoute,
  setDefaultHandler,
} from "workbox-routing";

const serviceWorkerName = self.location.pathname.replace(/^\//, "");
const useExcludedAssets = [
  ...excludeAssets,
  serviceWorkerName,
  `build/${serviceWorkerName}`,
];

const buildMap: Map<string, string | null> = appBundles.reduce(
  (map, bundle) => {
    const bundleName = bundle[0];
    if (useExcludedAssets.includes(bundleName)) return map;

    const revision = bundle.length === 3 && bundle[2].length;
    map.set(bundleName, revision ? null : manifestHash);
    map.set(`build/${bundleName}`, revision ? null : manifestHash);
    return map;
  },
  new Map<string, string | null>(),
);
// console.log("buildMap", buildMap);
export const assets = [...publicDirAssets, ...emittedAssets].filter(
  (asset) => !useExcludedAssets.includes(asset),
);

export { routes };

// TODO: check what happens with urls when using a custom base in Vite/Qwik
const urlsToEntriesMatcher = /^build\/q-/;
function urlsToEntries(urls: string[], hash: string): PrecacheEntry[] {
  return urls.map((url) => {
    // use null revision, removing the revision or using undefined will cause workbox warnings in runtime
    return buildMap.has(url)
      ? { url, revision: buildMap.get(url) }
      : { url, revision: url.match(urlsToEntriesMatcher) ? null : hash };
  });
}

/**
 * Add PWA capabilities.
 */
export function setupPwa() {
  if (import.meta.env.DEV) {
    console.info(
      `Qwik PWA v${version}, using ${
        promptForUpdate ? "prompt-for-update" : "auto-update"
      } strategy`,
    );
  }

  const noParamRoutes = routes.filter((r) => !r.hasParams);
  const paramRoutes = routes.filter((r) => r.hasParams);
  cleanupOutdatedCaches();

  precacheAndRoute(
    urlsToEntries(
      [...noParamRoutes.map((r) => r.pathname), ...assets],
      manifestHash,
    ),
  );

  // the rest of requests (like /api/) should be handled by network first (https://github.com/BuilderIO/qwik/issues/5148#issuecomment-1814692124)
  setDefaultHandler(new NetworkFirst());

  for (const route of noParamRoutes) {
    registerRoute(
      new NavigationRoute(createHandlerBoundToURL(route.pathname), {
        allowlist: [route.pattern],
      }),
    );
  }
  for (const route of paramRoutes) {
    registerRoute(route.pattern, new StaleWhileRevalidate());
  }

  if (promptForUpdate) {
    self.addEventListener("message", (event) => {
      if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
      }
    });
  } else {
    // Skip-Waiting Service Worker-based solution
    self.addEventListener("activate", async () => {
      // after we've taken over, iterate over all the current clients (windows)
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        // ...and refresh each one of them
        client.navigate(client.url);
      });
    });
    self.skipWaiting();
  }

  const base = "/build/"; // TODO: it should be dynamic based on the build
  const qprefetchEvent = new MessageEvent<ServiceWorkerMessage>("message", {
    data: {
      type: "qprefetch",
      base,
      links: routes.map((route) => route.pathname),
      bundles: appBundles.map((appBundle) => appBundle[0]),
    },
  });

  self.dispatchEvent(qprefetchEvent);
}

declare const version: string;
declare const promptForUpdate: boolean;
declare const appBundles: AppBundle[];

declare const excludeAssets: string[];
declare const publicDirAssets: string[];
declare const emittedAssets: string[];
declare const routes: {
  pathname: string;
  pattern: RegExp;
  hasParams: boolean;
}[];
declare const manifestHash: string;

declare const self: ServiceWorkerGlobalScope;

export type AppSymbols = Map<string, string>;
export type AppBundle =
  | [bundleName: string, importedBundleIds: number[]]
  | [
      bundleName: string,
      importedBundleIds: number[],
      symbolHashesInBundle: string[],
    ];

export type LinkBundle = [routePattern: RegExp, bundleIds: number[]];

export interface QPrefetchData {
  links?: string[];
  bundles?: string[];
  symbols?: string[];
}

export interface QPrefetchMessage extends QPrefetchData {
  type: "qprefetch";
  base: string;
}

export type ServiceWorkerMessage = QPrefetchMessage;

export interface ServiceWorkerMessageEvent {
  data: ServiceWorkerMessage;
}
