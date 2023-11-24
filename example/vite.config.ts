import { routes } from '@qwik-city-plan';
import { PluginOption, defineConfig, Plugin, } from "vite";
import { QwikBuildTarget, QwikVitePlugin, qwikVite } from "@builder.io/qwik/optimizer";
import { QwikCityPlugin, qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import fs from "node:fs/promises";
import fg from 'fast-glob'

export default defineConfig(() => {
  return {
    plugins: [
      
      
      qwikCity(), qwikVite(), tsconfigPaths(),
      qwikPwa()
    
      // VitePWA({
      //   strategies: 'injectManifest',
      //   srcDir: 'src',
      //   filename: 'routes/service-worker.ts'
      // }),
    
    ],
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
  };
});

let tempGenerateFunc: NonNullable<Plugin['generateBundle']> = (() => {}) satisfies Plugin['generateBundle']
type OutputBundle = Parameters<typeof tempGenerateFunc>[1]


export function qwikPwa(): PluginOption {
  let qwikPlugin: QwikVitePlugin | null = null;
  let qwikCityPlugin: QwikCityPlugin | null = null;
  let rootDir: string | null = null
  let outDir: string | null = null;
  let publicDir: string | null = null;
  let target: QwikBuildTarget | null = null;

  // make the type an argument of the generateBundle function
  let bundle: OutputBundle

  let clientOutDir: string 
  let basePathRelDir: string
  let clientOutBaseDir: string
  let swClientDistPath: string

  return [
    {
      name: 'qwik-pwa-mutual',
      enforce: 'post',
      configResolved(config) {
        rootDir = path.resolve(config.root);
        qwikPlugin = config.plugins.find((p) => p.name === 'vite-plugin-qwik') as QwikVitePlugin;
        qwikCityPlugin = config.plugins.find(
          (p) => p.name === 'vite-plugin-qwik-city'
        ) as QwikCityPlugin;
        target = qwikPlugin!.api.getOptions().target
        publicDir = config.publicDir;
        outDir = config.build?.outDir;

        clientOutDir = qwikPlugin!.api.getClientOutDir()!;
        basePathRelDir = qwikCityPlugin!.api.getBasePathname().replace(/^\/|\/$/, '');
        clientOutBaseDir = path.join(clientOutDir, basePathRelDir);
        swClientDistPath = path.join(clientOutBaseDir, 'service-worker.js');
      },
    },
    {
    name: 'qwik-pwa',
    enforce: 'post',
    generateBundle(_, _bundle) {
      bundle = _bundle
    },
    closeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        if (target !== 'client') {
          return
        }
        const publicDirAssets = await fg.glob('**/*' , {cwd: publicDir!})
        // the q-*.js files are going to be handled by qwik itself
        const emittedAssets = Object.keys(bundle).filter((key) => !/.*q-.*\.js$/.test(key))
        
        const routes = qwikCityPlugin!.api.getRoutes()
        console.log(qwikCityPlugin!.api.getRoutes())
        const swCode = await fs.readFile(swClientDistPath, 'utf-8');
        const swCodeUpdate = `
        const publicDirAssets = ${JSON.stringify(publicDirAssets)};
        const emittedAssets = ${JSON.stringify(emittedAssets)};
        const routes = [${routes.map(route => `{ pathname: ${JSON.stringify(route.pathname)}, pattern: new RegExp(${JSON.stringify(route.pattern.source)}) }`).join(',\n')}];
        
        ${swCode}
        `
        await fs.writeFile(swClientDistPath, swCodeUpdate);
      }
    }
  }, {
    name: 'qwik-pwa-ssr',
    enforce: 'post',
    closeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        if (target !== 'ssr') {
          return
        }
        const swCode = await fs.readFile(swClientDistPath, 'utf-8');
        const manifest = qwikPlugin!.api.getManifest()
        const swCodeUpdate = `
        const manifestHash = ${JSON.stringify(manifest?.manifestHash)};
        
        ${swCode}
        `
        await fs.writeFile(swClientDistPath, swCodeUpdate);
      }

    }

  }
]

}