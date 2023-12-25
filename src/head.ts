import type { DocumentMeta, DocumentLink } from "@builder.io/qwik-city";
// @ts-ignore
import * as head from "virtual:qwik-pwa/head";

const meta = head.meta as DocumentMeta[];
const links = head.links as DocumentLink[];

export { meta, links };
