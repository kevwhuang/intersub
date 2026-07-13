import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import IconApplePodcasts from '../../src/components/IconApplePodcasts.astro';
import IconXiaoyuzhou from '../../src/components/IconXiaoyuzhou.astro';
import MethodCurve from '../../src/components/MethodCurve.astro';
import QrCode from '../../src/components/QrCode.astro';

describe('IconApplePodcasts', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(IconApplePodcasts);
    });

    test('renders a hidden svg icon', () => {
        expect(html).toContain('<svg aria-hidden="true"');
        expect(html).toContain('viewBox="0 0 24 24"');
        expect(html).toContain('height="18"');
        expect(html).toContain('width="18"');
    });

    test('draws the mark inline with the current color', () => {
        expect(html).toContain('fill="currentColor"');
        expect(html).toContain('<path d="M5.34 0A5.328');
        expect(html).not.toContain('href=');
        expect(html).not.toContain('src=');
    });

    test('scales to the size prop', async () => {
        const container = await AstroContainer.create();

        const sized = await container.renderToString(IconApplePodcasts, { props: { size: 24 } });

        expect(sized).toContain('height="24"');
        expect(sized).toContain('width="24"');
    });
});

describe('IconXiaoyuzhou', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(IconXiaoyuzhou);
    });

    test('renders a hidden svg icon', () => {
        expect(html).toContain('<svg aria-hidden="true"');
        expect(html).toContain('viewBox="0 0 24 24"');
        expect(html).toContain('height="18"');
        expect(html).toContain('width="18"');
    });

    test('clips the orbit with inline defs', () => {
        expect(html).toContain('<defs>');
        expect(html).toContain('id="xyz-outside"');
        expect(html).toContain('id="xyz-inside"');
        expect(html).toContain('clip-path="url(#xyz-outside)"');
        expect(html).toContain('clip-path="url(#xyz-inside)"');
        expect(html).toContain('fill="currentColor"');
        expect(html.split('<ellipse').length - 1).toBe(2);
    });

    test('scales to the size prop', async () => {
        const container = await AstroContainer.create();

        const sized = await container.renderToString(IconXiaoyuzhou, { props: { size: 24 } });

        expect(sized).toContain('height="24"');
        expect(sized).toContain('width="24"');
    });
});

describe('MethodCurve', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(MethodCurve);
    });

    test('renders the decorative curve svg', () => {
        expect(html).toContain('<svg class="method__curve"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('preserveAspectRatio="none"');
        expect(html).toContain('viewBox="0 0 300 1000"');
    });

    test('draws the path and milestone dots', () => {
        expect(html).toContain('<path class="method__curve-path"');
        expect(html.split('class="method__curve-dot"').length - 1).toBe(4);
    });
});

describe('QrCode', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(QrCode);
    });

    test('renders a labeled svg qr code', () => {
        expect(html).toContain('aria-label="WeChat QR code"');
        expect(html).toContain('data-i18n-aria="WeChat QR code"');
        expect(html).toContain('shape-rendering="crispEdges"');
        expect(html).toContain('viewBox="0 0 33 33"');
        expect(html).toContain('height="100"');
        expect(html).toContain('width="100"');
    });

    test('draws the code as a single stroked path', () => {
        expect(html).toContain('stroke="currentColor"');
        expect(html.split('<path').length - 1).toBe(1);
    });

    test('scales to the size prop', async () => {
        const container = await AstroContainer.create();

        const sized = await container.renderToString(QrCode, { props: { size: 64 } });

        expect(sized).toContain('height="64"');
        expect(sized).toContain('width="64"');
    });
});
