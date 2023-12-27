# TODO LIST

- [ ] fix eslint/prettier: it is a pain to have to include the type in static imports
- [x] fix workbox runtime warnings: there are a few workbox runtime warnings in the example that should be checked (build/q-*.[webp|css])
- [ ] feat add prompt for update strategy: the user can lost form data if filling a form when the update is triggered
- [ ] test custom pwa assets generator config file: on change the app should receive a page reload (no dev server restart), maybe with a new example
- [x] don't inject web manifest icons when present in the manifest
- [x] include id and scope in the web manifest when missing
- [x] warn when missing `theme_color` in the web manifest

## Fix workbox runtime warnings

We must include the revision with `null` value in the precache manifest for `build/q-**` assets.
