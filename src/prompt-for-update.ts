import { $, useOnDocument, useSignal } from "@builder.io/qwik";
// @ts-ignore
import { promptForUpdate } from "virtual:qwik-pwa/client-mode";

export function usePromptForUpdate() {
  const prompt = useSignal(false);

  useOnDocument(
    "load",
    $(() => {
      // if using auto-update, remove the prompt logic
      if (promptForUpdate === true && "serviceWorker" in navigator) {
        let swr: ServiceWorkerRegistration | null;
        // @ts-ignore ignore globals for now
        window.loadNewVersion = () => {
          console.log("loadNewVersion", {
            prompt: prompt.value,
            waiting: swr?.waiting,
            state: swr?.waiting?.state,
          });
          if (prompt.value && swr?.waiting?.state === "installed") {
            swr.waiting.postMessage({ type: "SKIP_WAITING" });
          }
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
          // if already installed, but still not activated
          // for example, when the user cancels the prompt and then refreshes the page
          if (registration.waiting?.state === "installed") {
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
