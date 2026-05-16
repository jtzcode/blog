import type { CollectionEntry } from "astro:content";
import { BLOG_PATH } from "@/content.config";
import { SECTIONS, type SiteSection } from "@/config";
import { slugifyStr } from "./slugify";

type BlogEntryPath = Pick<CollectionEntry<"blog">, "id" | "filePath">;

const SECTION_CODES = new Set<string>(SECTIONS.map(({ code }) => code));

export function getPostPathSegments(id: string, filePath: string | undefined) {
  const rawPath = filePath ?? id;
  const blogPathIndex = rawPath.indexOf(BLOG_PATH);
  const relativePath =
    blogPathIndex >= 0
      ? rawPath.slice(blogPathIndex + BLOG_PATH.length)
      : rawPath;

  return relativePath
    .split("/")
    .filter(path => path !== "" && path !== "." && !path.startsWith("_"))
    .slice(0, -1)
    .map(segment => slugifyStr(segment));
}

export function getPostSection({
  id,
  filePath,
}: BlogEntryPath): SiteSection | undefined {
  const [section] = getPostPathSegments(id, filePath);
  return SECTION_CODES.has(section) ? (section as SiteSection) : undefined;
}
