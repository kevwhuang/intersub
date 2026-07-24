import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import IconXiaoyuzhou from '../../src/components/IconXiaoyuzhou.astro';

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
