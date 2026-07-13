import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import ErrorNotFound from '../../src/sections/ErrorNotFound.astro';

describe('ErrorNotFound', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(ErrorNotFound);
    });

    test('renders the 404 block', () => {
        expect(html).toContain('class="error-not-found"');
        expect(html).toContain('aria-labelledby="error-not-found-title"');
    });

    test('renders the status code', () => {
        expect(html).toContain('error-not-found__code');
        expect(html).toContain('>404</p>');
    });

    test('renders the heading', () => {
        expect(html).toContain('<h1 id="error-not-found-title"');
        expect(html).toContain('data-i18n="This page doesn\'t exist"');
        expect(html).toContain('This page doesn\'t exist</h1>');
    });

    test('renders the back home link', () => {
        expect(html).toContain('<a class="button" href="/"');
        expect(html).toContain('data-i18n="Go home"');
    });
});
