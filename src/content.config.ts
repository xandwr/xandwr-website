import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const CONTENT_ROOT = process.env.CONTENT_ROOT ?? '../xandwr-content';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${CONTENT_ROOT}/posts` }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    created: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${CONTENT_ROOT}/projects` }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    created: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    repo: z.string().url().optional(),
    url: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, projects };
