import { getCollection } from "astro:content";
import type { SiteSection } from "@/config";
import { getPostSection } from "./getPostSection";

export async function getSectionPosts(section: SiteSection) {
  const posts = await getCollection("blog", ({ data }) => !data.draft);

  return posts
    .filter(post => getPostSection(post) === section)
    .sort(
      (a, b) => b.data.pubDatetime.valueOf() - a.data.pubDatetime.valueOf()
    );
}
