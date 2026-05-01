import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const prerender = true;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "https://xandwr.com";
  const posts = (await getCollection("posts", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.created.getTime() - a.data.created.getTime()
  );

  const items = posts
    .map((post) => {
      const link = `${base}/posts/${post.id}/`;
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${post.data.created.toUTCString()}</pubDate>
      <description>${escape(post.data.description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>xandwr</title>
    <link>${base}/</link>
    <description>Xander Pickering's writing and projects.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
