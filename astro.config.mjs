// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://xandwr.com',
  output: 'server',
  adapter: cloudflare(),

  image: {
    domains: ['cdn.xandwr.com'],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [svelte()],
});