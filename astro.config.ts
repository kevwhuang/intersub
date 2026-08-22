import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import robots from 'astro-robots-txt';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const PRIVATE_ROUTES = new Set(['/404', '/500', '/admin']);

export default defineConfig({
    adapter: netlify(),
    build: {
        format: 'file',
    },
    devToolbar: {
        enabled: false,
    },
    integrations: [
        react(),
        robots(),
        sitemap({ filter: page => !PRIVATE_ROUTES.has(new URL(page).pathname), lastmod: new Date() }),
    ],
    site: 'https://intersubstudio.com',
    trailingSlash: 'never',
    vite: {
        plugins: [tailwind()],
    },
});
