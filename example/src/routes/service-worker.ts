import { setupServiceWorker } from "@builder.io/qwik-city/service-worker";
import { setupPwa } from "@qwikdev/pwa/sw";

setupServiceWorker();
setupPwa();

addEventListener("install", () => self.skipWaiting());

addEventListener("activate", () => self.clients.claim());
