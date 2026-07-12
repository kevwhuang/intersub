import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';

import ErrorNotFound from '../../src/sections/ErrorNotFound.astro';

describe('ErrorNotFound', () => {
    test('renders 404 component', async () => {
        const container = await AstroContainer.create();

        const html = await container.renderToString(ErrorNotFound);

        expect(html).toContain('error-not-found');
    });
});
