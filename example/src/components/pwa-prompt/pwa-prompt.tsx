import styles from "./pwa-prompt.module.css";
import { $, component$ } from "@builder.io/qwik";
import { usePromptForUpdate } from "@qwikdev/pwa/prompt-for-update";

export default component$(() => {
  // qwik pwa prompt for update
  const { prompt } = usePromptForUpdate();

  const hidePrompt = $(() => {
    prompt.value = false;
  });
  const loadNewVersion = $(() => {
    // @ts-ignore ignore globals for now
    window.loadNewVersion();
  });

  return (
    <div class={styles["ReloadPrompt-container"]}>
      {prompt.value && (
        <div class={styles["ReloadPrompt-toast"]}>
          <div class={styles["ReloadPrompt-message"]}>
            <span>
              New content available, click on reload button to update.
            </span>
          </div>
          <button
            class={styles["ReloadPrompt-toast-button"]}
            onClick$={() => loadNewVersion()}
          >
            Reload
          </button>
          <button
            class={styles["ReloadPrompt-toast-button"]}
            onClick$={() => hidePrompt()}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
});
