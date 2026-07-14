import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Footer from '../../src/sections/Footer.astro';
import { ROUTES } from '../../src/lib/constants';

const SOCIAL_URLS = [
    'https://podcasts.apple.com/cn/podcast/id1856157603',
    'https://xiaoyuzhoufm.com/podcast/6911ae852e59334c8539c411',
] as const;

const WECHAT_URL = 'https://u.wechat.com/MIhe6eduSSoNWiw9INP9YEQ?s=2';

describe('Footer', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Footer);
    });

    test('labels the footer for assistive tech with an i18n hook', () => {
        expect(html).toContain('aria-label="Site footer"');
        expect(html).toContain('data-i18n-aria="Site footer"');
    });

    test('renders both wordmarks as optimized lazy images with retina srcsets', () => {
        const wordmarks = html.match(/<img [^>]*class="site-footer__wordmark">/g) ?? [];

        expect(wordmarks).toHaveLength(2);
        expect(html).not.toContain('<picture');

        for (const wordmark of wordmarks) {
            expect(wordmark).toContain('data-image-component="true"');
            expect(wordmark).toContain('decoding="async"');
            expect(wordmark).toContain('height="32"');
            expect(wordmark).toContain('loading="lazy"');
            expect(wordmark).toContain('q=100');
            expect(wordmark).toMatch(/srcset="[^"]* 2x"/);
        }

        expect(html).toMatch(/<img[^>]*logo_en\.webp[^>]*alt="InterSub"[^>]*lang="en"/);
        expect(html).toMatch(/<img[^>]*logo_zh\.webp[^>]*alt="言际阁"[^>]*lang="zh"/);
    });

    test('renders a directory link for every route', () => {
        expect(html).toMatch(/<p class="site-footer__heading" data-i18n="Directory"/);

        for (const route of ROUTES) {
            expect(html.split(`class="site-footer__link" href="${route.href}"`).length - 1).toBe(1);
            expect(html).toMatch(new RegExp(`<span data-i18n="${route.label}"[^>]*>${route.label}</span>`));
        }
    });

    test('renders each social link over https in a new tab', () => {
        const socials = html.match(/<a class="site-footer__social [^>]*>/g) ?? [];

        expect(socials).toHaveLength(SOCIAL_URLS.length);

        for (const social of socials) {
            expect(social).toContain('aria-label=');
            expect(social).toContain('href="https://');
            expect(social).toContain('target="_blank"');
        }

        for (const url of SOCIAL_URLS) expect(html).toContain(`href="${url}"`);
    });

    test('renders the wechat qr code linked to the wechat url', () => {
        expect(html).toMatch(new RegExp(`<a class="site-footer__qr-link" href="${WECHAT_URL.replace('?', '\\?')}" target="_blank"`));
        expect(html).toMatch(/<svg aria-label="WeChat QR code"[^>]*viewBox="0 0 33 33"/);
        expect(html).toContain('data-i18n-aria="WeChat QR code"');
    });

    test('renders the copyright with an i18n html hook and the founder credit', () => {
        expect(html).toMatch(/<span data-i18n-html="footer-copyright"[^>]*>&copy; 2026 InterSub. All rights reserved.<\/span>/);
        expect(html).toContain('data-i18n="Founded by Lydia Zhu"');
    });
});
