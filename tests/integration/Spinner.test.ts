import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import Spinner from '../../src/components/Spinner';

describe('Spinner', () => {
    test('renders a decorative spinning ring', () => {
        const html = renderToStaticMarkup(createElement(Spinner));

        expect(html).toContain('<span aria-hidden="true"');
        expect(html).toContain('animation:dashboard__spin 0.6s linear infinite');
        expect(html).toContain('border-radius:50%');
        expect(html).toContain('border-top-color:transparent');
        expect(html).toContain('display:inline-block');
    });

    test('defaults to a 16px ring with a 2px border', () => {
        const html = renderToStaticMarkup(createElement(Spinner));

        expect(html).toContain('border:2px solid currentColor');
        expect(html).toContain('height:16px');
        expect(html).toContain('width:16px');
    });

    test('scales the border width with the size prop', () => {
        const html = renderToStaticMarkup(createElement(Spinner, { size: 48 }));

        expect(html).toContain('border:3px solid currentColor');
        expect(html).toContain('height:48px');
        expect(html).toContain('width:48px');
    });

    test('keeps at least a 2px border on small sizes', () => {
        const html = renderToStaticMarkup(createElement(Spinner, { size: 8 }));

        expect(html).toContain('border:2px solid currentColor');
        expect(html).toContain('height:8px');
        expect(html).toContain('width:8px');
    });
});
