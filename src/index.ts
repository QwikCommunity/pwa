import type { Plugin } from "vite";
import { createContext } from "./context";
import type { PWAOptions } from "./types";
import MainPlugin from "./plugins/main";
import ClientPlugin from "./plugins/client";
import SSRPlugin from "./plugins/ssr";
import AssetsPlugin from "./plugins/assets";

export * from "./types";

export function qwikPwa(
  options: PWAOptions = { preset: "minimal-2023" },
): Plugin[] {
  const ctx = createContext(options);
  return [
    MainPlugin(ctx),
    ClientPlugin(ctx),
    SSRPlugin(ctx),
    AssetsPlugin(ctx),
  ];
}
