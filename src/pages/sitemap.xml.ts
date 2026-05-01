import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "https://xandwr.com";

  const [posts, projects] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
  ]);

  const staticUrls = ["/", "/posts/", "/projects/"];

  const urls = [
    ...staticUrls.map((path) => ({
      loc: `${base}${path}`,
      lastmod: new Date().toISOString(),
    })),
    ...posts.map((post) => ({
      loc: `${base}/posts/${post.id}/`,
      lastmod: (post.data.updated ?? post.data.created).toISOString(),
    })),
    ...projects.map((project) => ({
      loc: `${base}/projects/${project.id}/`,
      lastmod: (project.data.updated ?? project.data.created).toISOString(),
    })),
  ];

  const body = urls
    .map(
      ({ loc, lastmod }) =>
        `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
