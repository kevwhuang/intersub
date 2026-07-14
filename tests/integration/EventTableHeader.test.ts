import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import EventTableHeader from '../../src/components/dashboard/EventTableHeader';

function renderHeader(sortKey: string, sortDirection: SortDirection) {
    return renderToStaticMarkup(createElement(EventTableHeader, { onSort: vi.fn(), sortDirection, sortKey }));
}

describe('EventTableHeader', () => {
    test('renders a grid row aligned with the events table', () => {
        const html = renderHeader('date', 'asc');

        expect(html).toContain('role="row"');
        expect(html).toContain('grid-template-columns:1fr 102px 92px 84px 110px 138px');
        expect(html).toContain('background:var(--color-snow)');
        expect(html).toContain('border-bottom:1px solid var(--color-silver)');
    });

    test('renders six column headers', () => {
        const html = renderHeader('date', 'asc');

        expect(html.split('role="columnheader"').length - 1).toBe(6);
        expect(html).toContain('>Time</span>');
        expect(html).toContain('>Actions</span>');
    });

    test('renders sort buttons for title, date, location, and who', () => {
        const html = renderHeader('date', 'asc');

        expect(html.split('dashboard-button--ghost').length - 1).toBe(4);
        expect(html).toContain('>Title</button>');
        expect(html).toContain('>Location</button>');
        expect(html).toContain('>Who</button>');
    });

    test('marks only the active column as sorted descending', () => {
        const html = renderHeader('date', 'desc');

        expect(html.split('aria-sort="descending"').length - 1).toBe(1);
        expect(html.split('aria-sort="none"').length - 1).toBe(3);
        expect(html).toContain('>Date \u2193</button>');
    });

    test('marks only the active column as sorted ascending', () => {
        const html = renderHeader('level', 'asc');

        expect(html.split('aria-sort="ascending"').length - 1).toBe(1);
        expect(html.split('aria-sort="none"').length - 1).toBe(3);
        expect(html).toContain('>Who \u2191</button>');
    });
});
