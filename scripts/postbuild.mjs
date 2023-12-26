import { readFile, rm, writeFile } from "node:fs/promises";

async function postBuild() {
  await Promise.all([
    rm("./lib-types/context.d.ts"),
    rm("./lib-types/assets/", { recursive: true }),
    rm("./lib-types/plugins/", { recursive: true }),
    readFile("./lib-types/head.d.ts", "utf-8").then((content) => {
      return Promise.all([
        writeFile("./lib-types/head.d.cts", content, "utf-8"),
        writeFile("./lib-types/head.d.mts", content, "utf-8"),
      ]);
    }),
    readFile("./lib-types/index.d.ts", "utf-8").then((content) => {
      return Promise.all([
        writeFile("./lib-types/index.d.cts", content, "utf-8"),
        writeFile("./lib-types/index.d.mts", content, "utf-8"),
      ]);
    }),
    readFile("./lib-types/sw.d.ts", "utf-8").then((content) => {
      return Promise.all([
        writeFile("./lib-types/sw.d.cts", content, "utf-8"),
        writeFile("./lib-types/sw.d.mts", content, "utf-8"),
      ]);
    }),
  ]);
  // fix mts file, we must use `./types.js` in the static import (with extension)
  await readFile("./lib-types/index.d.mts", "utf-8").then((content) => {
    return writeFile(
      "./lib-types/index.d.mts",
      content.replace(/\.\/types/g, "./types.js"),
      "utf-8",
    );
  });
}

postBuild();
