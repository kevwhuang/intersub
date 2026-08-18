import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Curve from '../../src/components/Curve.astro';

describe('Curve', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Curve);
    });

    test('renders the decorative curve svg', () => {
        expect(html).toContain('<svg class="curve"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('preserveAspectRatio="none"');
        expect(html).toContain('viewBox="0 0 300 1000"');
    });

    test('draws the path and milestone dots', () => {
        expect(html).toContain('<path class="curve__path"');
        expect(html.split('class="curve__dot"').length - 1).toBe(4);
    });
});
