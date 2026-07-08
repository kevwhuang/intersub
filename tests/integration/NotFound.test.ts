import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';

import NotFound from '../../src/sections/NotFound.astro';

describe('NotFound', () => {
    test('renders 404 component', async () => {
        const container = await AstroContainer.create();

        const html = await container.renderToString(NotFound);

        expect(html).toContain('not-found');
    });
});
