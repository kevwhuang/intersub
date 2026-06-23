import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';

import NotFound from '../../src/sections/NotFound.astro';

describe('NotFound', () => {
    test('renders 404 heading', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(NotFound);

        expect(html).toMatch(/<h1[^>]*>[\s]*404[\s]*<\/h1>/);
    });
});
