import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import IconApplePodcasts from '../../src/components/IconApplePodcasts.astro';

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
