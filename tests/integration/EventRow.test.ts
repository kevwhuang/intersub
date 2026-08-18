import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import EventRow from '../../src/components/dashboard/EventRow';
import eventApril from '../../src/content/events/2026_04_25.json';
import eventJune from '../../src/content/events/2026_06_15.json';

const EVENT_WITHOUT_LEVEL: AdminEvent = { ...eventApril, id: '2026_04_25', level: undefined };
const EVENT_WITHOUT_TIME: AdminEvent = { ...eventJune, id: '2026_06_15', time: '' };
const EVENT_WITH_LEVEL: AdminEvent = { ...eventJune, id: '2026_06_15' };

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
        expect(html).toContain('<time dateTime="2026-06-15">Jun 15, 2026</time>');
        expect(html).toContain('>19:00\u201321:00</span>');
        expect(html).toContain('>Shanghai</span>');
    });

    test('tags the level with its palette class', () => {
        const html = renderRow(EVENT_WITH_LEVEL);

        expect(html).toContain('<span class="tag tag--advanced">Advanced</span>');
        expect(html.split('class="tag').length - 1).toBe(1);
    });

    test('omits the level tag when the entry has none', () => {
        const html = renderRow(EVENT_WITHOUT_LEVEL);

        expect(html).not.toContain('class="tag');
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
        expect(html).toContain('<time dateTime="2026-06-15">Jun 15, 2026</time> <span aria-hidden="true">\u00B7</span> 19:00\u201321:00 <span aria-hidden="true">\u00B7</span> Shanghai');
        expect(html).toContain('>Better Face Inside Your Face</p>');
        expect(html).toContain('>Advanced</span>');
    });

    test('omits the time from the mobile meta line when the entry has none', () => {
        const timed = renderRow(EVENT_WITH_LEVEL, true);
        const untimed = renderRow(EVENT_WITHOUT_TIME, true);

        expect(untimed).toContain('<time dateTime="2026-06-15">Jun 15, 2026</time> <span aria-hidden="true">\u00B7</span> Shanghai');
        expect(untimed.split('aria-hidden="true"').length - 1).toBe(1);
        expect(timed.split('aria-hidden="true"').length - 1).toBe(2);
    });
});
