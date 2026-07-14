import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Navbar from '../../src/sections/Navbar.astro';
import { ROUTES } from '../../src/lib/constants';

describe('Navbar', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Navbar);
    });

    test('renders the brand link home with an i18n aria hook', () => {
        expect(html).toMatch(/<a[^>]*aria-label="InterSub Home"[^>]*href="\/"/);
        expect(html).toContain('data-i18n-aria="InterSub Home"');
    });

    test('renders both logo variants as optimized Astro images', () => {
        expect(html.split('data-image-component="true"').length - 1).toBe(2);
        expect(html).toMatch(/<img[^>]*logo_en\.webp[^>]*alt="InterSub"/);
        expect(html).toMatch(/<img[^>]*logo_zh\.webp[^>]*alt="言际阁"/);
        expect(html.split(' 2x"').length - 1).toBe(2);
    });

    test('renders a nav link for every route', () => {
        expect(html.split('class="site-nav__link"').length - 1).toBe(ROUTES.length);

        for (const route of ROUTES) {
            expect(html).toContain(`class="site-nav__link" href="${route.href}"`);
            expect(html).toMatch(new RegExp(`<span data-i18n="${route.label}"[^>]*>${route.label}</span>`));
        }
    });

    test('labels the primary nav for assistive tech', () => {
        expect(html).toMatch(/<nav[^>]*aria-label="Primary"/);
    });

    test('renders the language toggle button', () => {
        expect(html).toMatch(/<button[^>]*aria-label="Switch language"[^>]*data-lang-toggle[^>]*type="button"/);
        expect(html).toContain('中文');
    });

    test('renders the mobile menu toggle collapsed with a state-neutral label', () => {
        expect(html).toMatch(/<button[^>]*aria-controls="site-nav-menu"[^>]*aria-expanded="false"[^>]*data-nav-toggle[^>]*type="button"/);
        expect(html).toContain('aria-label="Toggle navigation"');
        expect(html).toContain('id="site-nav-menu"');
    });
});
