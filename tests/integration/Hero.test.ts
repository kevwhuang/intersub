import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Hero from '../../src/sections/Hero.astro';

const SUBTITLE = 'We are dedicated to enhancing English communication skills for adults and providing solutions tailored to specific workplace and life needs.';

describe('Hero', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Hero);
    });

    test('labels the section by its headline for assistive tech', () => {
        expect(html).toContain('<section class="hero grid isolate overflow-hidden relative" aria-labelledby="hero-title"');
        expect(html).toMatch(/<h1 id="hero-title"/);
        expect(html.split('id="hero-title"').length - 1).toBe(1);
    });

    test('renders the hero background image eagerly', () => {
        expect(html).toContain('hero.webp');
        expect(html).toContain('class="hero__background-image"');
        expect(html).toContain('data-image-component="true"');
        expect(html).toContain('decoding="sync"');
        expect(html).toContain('fetchpriority="high"');
        expect(html).toContain('loading="eager"');
        expect(html).toContain('sizes="(orientation: portrait) 134vh, 100vw"');
    });

    test('renders a responsive srcset for every configured width', () => {
        expect(html).toContain('srcset=');
        expect(html).toContain('768w');
        expect(html).toContain('1280w');
        expect(html).toContain('1920w');
        expect(html).toContain('2400w');
    });

    test('hides the decorative background and overlay from assistive tech', () => {
        expect(html).toContain('class="hero__background absolute" aria-hidden="true"');
        expect(html).toContain('class="hero__overlay absolute" aria-hidden="true"');
    });

    test('renders the headline with highlighted words and an i18n html hook', () => {
        expect(html).toContain('data-i18n-html="hero-title"');
        expect(html).toMatch(/<h1[^>]*class="hero__title"/);
        expect(html).toMatch(/<span[^>]*class="text-cobalt-bright"[^>]*>Authority<\/span>/);
        expect(html).toMatch(/<span[^>]*class="text-cobalt-bright"[^>]*>English<\/span>/);
    });

    test('renders the subtitle with a matching i18n key', () => {
        expect(html).toContain(`data-i18n="${SUBTITLE}"`);
        expect(html.split(SUBTITLE).length - 1).toBe(2);
    });

    test('marks the headline and subtitle for load-time animation', () => {
        expect(html.split('data-scroll').length - 1).toBe(2);
        expect(html).toMatch(/<h1[^>]*data-scroll/);
        expect(html).toMatch(/<p[^>]*class="hero__subtitle"[^>]*data-scroll/);
    });
});
