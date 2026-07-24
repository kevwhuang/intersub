import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import MethodCurve from '../../src/components/MethodCurve.astro';

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
