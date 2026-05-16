import { getRelativeUrl } from "./getRelativeUrl";
import { getPostPathSegments } from "./getPostSection";

export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  const pathSegments = getPostPathSegments(id, filePath);

  const basePath = includeBase ? getRelativeUrl("/posts") : "";
  const blogId = id.split("/");
  const slug = String(blogId.length > 0 ? blogId.slice(-1) : blogId).replace(
    /\.mdx?$/,
    ""
  );

  if (!pathSegments || pathSegments.length < 1) {
    return [basePath, slug].join("/");
  }

  return [basePath, ...pathSegments, slug].join("/");
}
