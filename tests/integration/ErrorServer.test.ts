import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import ErrorServer from '../../src/sections/ErrorServer.astro';

describe('ErrorServer', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(ErrorServer);
    });

    test('renders the 500 block', () => {
        expect(html).toContain('class="error-server"');
        expect(html).toContain('aria-labelledby="error-server-title"');
    });

    test('renders the status code', () => {
        expect(html).toContain('error-server__code');
        expect(html).toContain('>500</p>');
    });

    test('renders the heading', () => {
        expect(html).toContain('<h1 id="error-server-title"');
        expect(html).toContain('data-i18n="Something went wrong"');
        expect(html).toContain('Something went wrong</h1>');
    });

    test('renders the back home link', () => {
        expect(html).toContain('<a class="button" href="/"');
        expect(html).toContain('data-i18n="Go home"');
    });
});
