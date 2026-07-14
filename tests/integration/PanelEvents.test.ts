import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import PanelEvents from '../../src/components/dashboard/PanelEvents';
import eventApril from '../../src/content/events/2026-04-25.json';
import eventJune from '../../src/content/events/2026-06-15.json';

type PanelProps = Parameters<typeof PanelEvents>[0];

const EMPTY_FORM: EventFormData = { content: '', cover: '', date: '', level: '', location: '', time: '', title: '' };

const EVENTS: AdminEvent[] = [
    { ...eventApril, id: '2026-04-25' },
    { ...eventJune, id: '2026-06-15' },
];

function renderPanel(overrides: Partial<PanelProps> = {}) {
    return renderToStaticMarkup(createElement(PanelEvents, {
        activeLevel: 'all',
        activeLocation: 'all',
        activeTiming: 'all',
        allEvents: EVENTS,
        editingEventId: null,
        eventForm: null,
        eventFormErrors: {},
        events: EVENTS,
        isMobile: false,
        isSaving: false,
        locations: ['Shanghai'],
        onCancelEdit: vi.fn(),
        onLevelChange: vi.fn(),
        onLocationChange: vi.fn(),
        onRequestDelete: vi.fn(),
        onSave: vi.fn(),
        onSort: vi.fn(),
        onStartEdit: vi.fn(),
        onStartNew: vi.fn(),
        onTimingChange: vi.fn(),
        onUpdate: vi.fn(),
        sortDirection: 'asc',
        sortKey: 'date',
        ...overrides,
    }));
}

describe('PanelEvents', () => {
    test('renders the heading with corpus stats from all events', () => {
        const html = renderPanel();

        expect(html).toContain('>Events</h1>');
        expect(html).toContain('<span>2 events</span>');
        expect(html).toContain('<span>1 location</span>');
        expect(html).toContain('<span>1 Intermediate</span>');
        expect(html).toContain('<span>1 Advanced</span>');
        expect(html).toContain('text-transform:lowercase');
    });

    test('uses singular labels and omits zero-count levels', () => {
        const html = renderPanel({ allEvents: [EVENTS[1]], events: [EVENTS[1]] });

        expect(html).toContain('<span>1 event</span>');
        expect(html).toContain('<span>1 location</span>');
        expect(html).toContain('<span>1 Advanced</span>');
        expect(html).not.toContain('<span>1 Intermediate</span>');
        expect(html).not.toContain('Beginner</span>');
    });

    test('renders the filter chips and the new event action', () => {
        const html = renderPanel();

        expect(html).toContain('>When</p>');
        expect(html).toContain('>Where</p>');
        expect(html).toContain('>Who</p>');
        expect(html).toContain('<button class="chip chip--active" type="button">All</button>');
        expect(html).toContain('<button class="chip" type="button">Shanghai</button>');
        expect(html).toContain('+\u2002New event</button>');
    });

    test('renders a sortable table with one row per event on desktop', () => {
        const html = renderPanel();

        expect(html).toContain('aria-label="Events"');
        expect(html).toContain('role="table"');
        expect(html).toContain('>Date \u2191</button>');
        expect(html.split('role="row"').length - 1).toBe(3);
        expect(html).toContain('>From Expansion to Integration</p>');
        expect(html).toContain('<time dateTime="2026-04-25">Apr 25, 2026</time>');
        expect(html).toContain('>Better Face Inside Your Face</p>');
        expect(html).toContain('<time dateTime="2026-06-15">Jun 15, 2026</time>');
        expect(html).toContain('class="tag tag--intermediate"');
        expect(html).toContain('class="tag tag--advanced"');
    });

    test('stacks entries without table semantics on mobile', () => {
        const html = renderPanel({ isMobile: true });

        expect(html).not.toContain('role="table"');
        expect(html).not.toContain('role="columnheader"');
        expect(html).toContain('>From Expansion to Integration</p>');
        expect(html).toContain('>Better Face Inside Your Face</p>');
        expect(html).toContain('<time dateTime="2026-06-15">Jun 15, 2026</time> <span aria-hidden="true">\u00B7</span> 19:00\u201321:00 <span aria-hidden="true">\u00B7</span> Shanghai');
    });

    test('shows the empty state when no events match the filters', () => {
        const html = renderPanel({ events: [] });

        expect(html).toContain('No events found');
        expect(html).toContain('Try a different search or filter, or add a new event.');
        expect(html).toContain('<span>2 events</span>');
        expect(html).not.toContain('role="table"');
    });

    test('renders the edit form populated with the event values', () => {
        const html = renderPanel({ editingEventId: '2026-06-15', eventForm: eventJune });

        expect(html).toContain('>Edit event</h1>');
        expect(html).toContain('value="Better Face Inside Your Face"');
        expect(html).toContain('value="2026-06-15"');
        expect(html).toContain('value="19:00\u201321:00"');
        expect(html).toContain('aria-label="Save changes"');
        expect(html).toContain('>Delete event</button>');
        expect(html).not.toContain('>Events</h1>');
    });

    test('renders the create form without a delete action', () => {
        const html = renderPanel({ editingEventId: 'new', eventForm: EMPTY_FORM });

        expect(html).toContain('>New event</h1>');
        expect(html).toContain('aria-label="Create event"');
        expect(html).not.toContain('Delete event');
    });

    test('renders validation errors against their fields', () => {
        const html = renderPanel({
            editingEventId: 'new',
            eventForm: EMPTY_FORM,
            eventFormErrors: { date: true, title: true },
        });

        expect(html).toContain('Title is required.');
        expect(html).toContain('Date is required.');
        expect(html).toContain('id="error-event-title"');
        expect(html).toContain('aria-describedby="error-event-date"');
        expect(html.split('dashboard-input--error').length - 1).toBe(2);
    });
});
