# Qwik PWA

> Turn your Qwik Application into an offline PWA

## Installation

```sh
npm install --save-dev @qwikdev/pwa
```

`vite.config.ts`:

```ts
import { qwikPwa } from "@qwikdev/pwa";

export default defineConfig(() => {
  return {
    define: {
      // (optional) enables debugging in workbox
      "process.env.NODE_ENV": JSON.stringify("development"),
    },
    plugins: [qwikCity(), qwikVite(), qwikPwa()],
  };
});
```
