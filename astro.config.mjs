// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://xandwr.com',
  output: 'server',
  adapter: cloudflare(),

  image: {
    domains: ['cdn.xandwr.com'],
  },

  integrations: [svelte(), mdx()],
});
