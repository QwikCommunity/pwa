import { $, useOnDocument, useSignal } from "@builder.io/qwik";

// TODO: expose a new virtual for prompt configuration and add protection here:
//  don't include useOnDocument if using auto-update
//  the auto-update behavior will claim all clients from the sw

export function usePromptForUpdate() {
  const prompt = useSignal(false);

  useOnDocument(
    "load",
    $(() => {
      if ("serviceWorker" in navigator) {
        let swr: ServiceWorkerRegistration | null;
        // @ts-ignore ignore globals for now
        window.loadNewVersion = () => {
          console.log("loadNewVersion", {
            prompt: prompt.value,
            waiting: swr?.waiting,
            state: swr?.waiting?.state,
          });
          prompt.value && swr?.waiting?.postMessage({ type: "SKIP_WAITING" });
        };
        navigator.serviceWorker.ready.then((registration) => {
          swr = registration;
          registration.addEventListener("updatefound", () => {
            const newSW = registration.installing;
            newSW?.addEventListener("statechange", () => {
              console.log("newSW.state", newSW?.state);
              if (newSW?.state === "activated") {
                window.location.reload();
              }
              if (newSW?.state === "installed") {
                // New service worker is installed, but awaiting activation
                prompt.value = true;
              }
            });
          });
          // if already installed, but not activated, for example,
          // when the user cancels the prompt and then refreshes the page
          if (registration.waiting) {
            prompt.value = true;
          }
        });
      }
    }),
  );

  return { prompt };
}

/* can we do this here in qwik?
declare global {
  interface Window {
    loadNewVersion: () => void;
  }
}
*/
