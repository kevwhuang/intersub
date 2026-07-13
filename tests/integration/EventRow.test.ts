import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import EventRow from '../../src/components/dashboard/EventRow';
import eventApril from '../../src/content/events/2026-04-25.json';
import eventJune from '../../src/content/events/2026-06-15.json';

const EVENT_WITHOUT_LEVEL: AdminEvent = { ...eventApril, id: '2026-04-25', level: undefined };
const EVENT_WITH_LEVEL: AdminEvent = { ...eventJune, id: '2026-06-15' };

function renderRow(entry: AdminEvent, isMobile = false) {
    return renderToStaticMarkup(createElement(EventRow, { entry, isMobile, onDelete: vi.fn(), onEdit: vi.fn() }));
}

describe('EventRow', () => {
    test('renders a desktop grid row with one cell per column', () => {
        const html = renderRow(EVENT_WITH_LEVEL);

        expect(html).toContain('role="row"');
        expect(html.split('role="cell"').length - 1).toBe(6);
    });

    test('renders the entry values in their cells', () => {
        const html = renderRow(EVENT_WITH_LEVEL);

        expect(html).toContain('>Better Face Inside Your Face</p>');
        expect(html).toContain('>Jun 15, 2026</span>');
        expect(html).toContain('>19:00\u201321:00</span>');
        expect(html).toContain('>Shanghai</span>');
    });

    test('tags the level with its palette colors', () => {
        const html = renderRow(EVENT_WITH_LEVEL);

        expect(html).toContain('>Advanced</span>');
        expect(html).toContain('background:var(--color-rose)');
        expect(html).toContain('color:var(--color-crimson)');
        expect(html).toContain('text-transform:uppercase');
    });

    test('omits the level tag when the entry has none', () => {
        const html = renderRow(EVENT_WITHOUT_LEVEL);

        expect(html).not.toContain('text-transform:uppercase');
        expect(html).not.toContain('>Advanced</span>');
    });

    test('renders edit and delete actions', () => {
        const html = renderRow(EVENT_WITH_LEVEL);

        expect(html).toContain('>Edit</button>');
        expect(html).toContain('>Delete</button>');
        expect(html.split('dashboard-button--danger').length - 1).toBe(1);
    });

    test('stacks the entry details with separators on mobile', () => {
        const html = renderRow(EVENT_WITH_LEVEL, true);

        expect(html).not.toContain('role="row"');
        expect(html).toContain('Jun 15, 2026 \u00B7 19:00\u201321:00 \u00B7 Shanghai');
        expect(html).toContain('>Better Face Inside Your Face</p>');
        expect(html).toContain('>Advanced</span>');
    });
});
