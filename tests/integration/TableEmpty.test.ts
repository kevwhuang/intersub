import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import TableEmpty from '../../src/components/dashboard/TableEmpty';

const html = renderToStaticMarkup(createElement(TableEmpty, {
    description: 'Try a different search or filter, or add a new event.',
    title: 'No events found',
}));

describe('TableEmpty', () => {
    test('renders the title and description', () => {
        expect(html).toContain('No events found</p>');
        expect(html).toContain('Try a different search or filter, or add a new event.</p>');
    });

    test('centers the message block with generous padding', () => {
        expect(html).toContain('padding:56px 24px');
        expect(html).toContain('text-align:center');
    });

    test('styles the title as a heading and mutes the description', () => {
        expect(html).toContain('font-family:var(--font-heading)');
        expect(html).toContain('font-weight:600');
        expect(html).toContain('color:var(--color-slate-ghost)');
    });
});
