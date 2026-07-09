import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';

import NotFoundError from '../../src/sections/NotFoundError.astro';

describe('NotFoundError', () => {
    test('renders 404 component', async () => {
        const container = await AstroContainer.create();

        const html = await container.renderToString(NotFoundError);

        expect(html).toContain('not-found');
    });
});
