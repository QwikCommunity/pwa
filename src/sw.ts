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

export const assets = [...publicDirAssets, ...emittedAssets];
export { routes };

function urlsToEntries(urls: string[], hash: string): PrecacheEntry[] {
  const matcher = /^build\/q-/;
  return urls.map((url) => {
    const match = url.match(matcher);
    return match ? { url } : { url, revision: hash };
  });
}

export function setupPwa() {
  const noParamRoutes = routes.filter((r) => !r.hasParams);
  const paramRoutes = routes.filter((r) => r.hasParams);
  cleanupOutdatedCaches();

  precacheAndRoute(
    urlsToEntries(
      [...noParamRoutes.map((r) => r.pathname), ...assets],
      manifestHash
    )
  );

  // the rest of requests (like /api/) should be handled by network first (https://github.com/BuilderIO/qwik/issues/5148#issuecomment-1814692124)
  setDefaultHandler(new NetworkFirst());

  for (const route of noParamRoutes) {
    registerRoute(
      new NavigationRoute(createHandlerBoundToURL(route.pathname), {
        allowlist: [route.pattern],
      })
    );
  }
  for (const route of paramRoutes) {
    registerRoute(route.pattern, new StaleWhileRevalidate());
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

declare const appBundles: AppBundle[];

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
