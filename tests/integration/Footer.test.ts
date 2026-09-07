import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Footer from '../../src/sections/Footer.astro';
import { ROUTES } from '../../src/lib/constants';

const WECHAT_URL = 'http://weixin.qq.com/r/mp/zSNvd3zEVyEorTgU93bf';
const XIAOYUZHOU_LABEL = 'Xiaoyuzhou (小宇宙)';
const XIAOYUZHOU_URL = 'https://xiaoyuzhoufm.com/podcast/6911ae852e59334c8539c411';

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

    test('renders the xiaoyuzhou link as the only social link in a new tab', () => {
        const socials = html.match(/<a class="site-footer__social [^>]*>/g) ?? [];

        expect(socials).toHaveLength(1);
        expect(socials[0]).toContain(`aria-label="${XIAOYUZHOU_LABEL}"`);
        expect(socials[0]).toContain(`href="${XIAOYUZHOU_URL}"`);
        expect(socials[0]).toContain('target="_blank"');
        expect(socials[0]).toContain(`title="${XIAOYUZHOU_LABEL}"`);
        expect(html).toContain('clip-path="url(#xyz-outside)"');
        expect(html).not.toContain('Apple Podcasts');
        expect(html).not.toContain('podcasts.apple.com');
        expect(html).not.toContain('site-footer__socials');
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
