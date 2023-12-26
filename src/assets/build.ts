import { mkdir } from "node:fs/promises";
import { generateAssets } from "@vite-pwa/assets-generator/api/generate-assets";
import { writeWebManifest } from "./manifest";
import { AssetsGeneratorContext } from "./types";
import { QwikPWAContext } from "../context";

export async function generate(
  ctx: QwikPWAContext,
  assetsContext: AssetsGeneratorContext,
) {
  await mkdir(assetsContext.imageOutDir, { recursive: true });
  await Promise.all([
    generateAssets(
      assetsContext.assetsInstructions,
      true,
      assetsContext.imageOutDir,
    ),
    writeWebManifest(ctx, assetsContext),
  ]);
}

export function resolveSWPrecachingAssets(
  assetsContext: AssetsGeneratorContext,
) {
  const resources = new Set<string>();
  const instruction = assetsContext.assetsInstructions;
  // exclude svg file since it is in the public folder
  Array.from(Object.keys(instruction.favicon))
    .filter((icon) => !icon.endsWith(".svg"))
    .forEach((icon) => resources.add(icon));
  Array.from(Object.keys(instruction.transparent)).forEach((icon) =>
    resources.add(icon),
  );
  Array.from(Object.keys(instruction.maskable)).forEach((icon) =>
    resources.add(icon),
  );
  Array.from(Object.keys(instruction.apple)).forEach((icon) =>
    resources.add(icon),
  );
  Array.from(Object.keys(instruction.appleSplashScreen)).forEach((icon) =>
    resources.add(icon),
  );

  return Array.from(resources);
}
