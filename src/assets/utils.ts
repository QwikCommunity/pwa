import type {
  AppleSplashScreenLink,
  FaviconLink,
  HtmlLink,
} from "@vite-pwa/assets-generator/api";
import type { DocumentLink } from "@builder.io/qwik-city";

export function mapLink(
  includeId: boolean,
  link: HtmlLink | FaviconLink | AppleSplashScreenLink,
) {
  const entry: DocumentLink = {
    key: link.href,
  };
  if (includeId && link.id) entry.id = link.id;

  entry.rel = link.rel;

  if ("media" in link && link.media) entry.media = link.media;

  entry.href = link.href;

  if ("sizes" in link && link.sizes) entry.sizes = link.sizes;

  if ("type" in link && link.type) entry.type = link.type;

  return entry;
}
