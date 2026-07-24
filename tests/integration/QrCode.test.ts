import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import QrCode from '../../src/components/QrCode.astro';

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
