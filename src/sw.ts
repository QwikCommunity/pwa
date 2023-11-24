import type { PrecacheEntry } from "workbox-precaching";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";

import { NavigationRoute, registerRoute } from "workbox-routing";

export const assets = [...publicDirAssets, ...emittedAssets];
export { routes }

function urlsToEntries(urls: string[], hash: string): PrecacheEntry[] {
  const matcher = /^build\/q-([a-f0-9]{8})\./;
  return urls.map((url) => {
    const match = url.match(matcher);
    return {
      url,
      revision: `${match ? match[1] : hash}`,
    };
  });
}

export function setupPwa() {
  cleanupOutdatedCaches();

  precacheAndRoute(
    urlsToEntries([...routes.map((r) => r.pathname), ...assets], manifestHash)
  );

  // should be registered after precacheAndRoute
  for (const route of routes) {
    registerRoute(
      new NavigationRoute(createHandlerBoundToURL(route.pathname), {
        allowlist: [route.pattern],
      })
    );
  }

//   addEventListener("install", () => self.skipWaiting());

//   addEventListener("activate", () => self.clients.claim());

  const base = "/build/"; // temp, it should be dynamic based on the build
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

declare const appBundles: AppBundle[];

declare const publicDirAssets: string[];
declare const emittedAssets: string[];
declare const routes: { pathname: string; pattern: RegExp }[];
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
