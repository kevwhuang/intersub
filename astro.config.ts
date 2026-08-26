import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import robots from 'astro-robots-txt';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

const PRIVATE_ROUTES = new Set(['/404', '/500', '/admin']);

export default defineConfig({
    adapter: netlify(),
    build: {
        format: 'file',
    },
    devToolbar: {
        enabled: false,
    },
    fonts: [
        {
            cssVariable: '--font-hanken-grotesk',
            display: 'block',
            name: 'Hanken Grotesk',
            provider: fontProviders.fontsource(),
            styles: ['normal'],
            subsets: ['latin'],
            weights: [400, 500, 600, 700],
        },
        {
            cssVariable: '--font-ibm-plex-mono',
            display: 'block',
            fallbacks: ['Courier New', 'monospace'],
            name: 'IBM Plex Mono',
            provider: fontProviders.fontsource(),
            styles: ['normal'],
            subsets: ['latin'],
            weights: [400, 500],
        },
        {
            cssVariable: '--font-space-grotesk',
            display: 'block',
            name: 'Space Grotesk',
            provider: fontProviders.fontsource(),
            styles: ['normal'],
            subsets: ['latin'],
            weights: [500, 600, 700],
        },
    ],
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
