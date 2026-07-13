import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import EditForm from '../../src/components/dashboard/EditForm';
import eventJune from '../../src/content/events/2026-06-15.json';
import { LEVELS } from '../../src/lib/constants';

type EventFormData = typeof eventJune;

const EMPTY_FORM: EventFormData = { content: '', cover: '', date: '', level: '', location: '', time: '', title: '' };

const EVENT_FIELD_ROWS: EditFormField<EventFormData>[][] = [
    [{ errorMessage: 'Title is required.', key: 'title', kind: 'input', label: 'Title', required: true }],
    [
        { errorMessage: 'Date is required.', key: 'date', kind: 'date', label: 'Date', required: true },
        { errorMessage: 'Time must be a 24-hour range.', key: 'time', kind: 'input', label: 'Time', required: true },
    ],
    [
        { errorMessage: 'Location is required.', key: 'location', kind: 'input', label: 'Location', required: true },
        { key: 'level', kind: 'select', label: 'Who', options: LEVELS },
    ],
    [{ errorMessage: 'Cover must be a URL or internal image path.', key: 'cover', kind: 'input', label: 'Cover' }],
    [{ errorMessage: 'Content is required.', key: 'content', kind: 'textarea', label: 'Content', labelSuffix: '\u00B7 Markdown', minHeight: 200, mono: true, required: true, rows: 9 }],
];

function renderForm(overrides: Record<string, unknown> = {}) {
    return renderToStaticMarkup(createElement(EditForm, {
        editingId: '2026-06-15',
        entity: 'event',
        fieldRows: EVENT_FIELD_ROWS,
        form: eventJune,
        formErrors: {},
        isMobile: false,
        isSaving: false,
        onCancel: vi.fn(),
        onDelete: vi.fn(),
        onSave: vi.fn(),
        onUpdate: vi.fn(),
        ...overrides,
    }));
}

describe('EditForm', () => {
    test('renders the edit heading with save, cancel, and delete actions', () => {
        const html = renderForm();

        expect(html).toContain('>Edit event</h1>');
        expect(html).toContain('aria-label="Save changes"');
        expect(html).toContain('>Save changes</button>');
        expect(html).toContain('>Cancel</button>');
        expect(html).toContain('>Delete event</button>');
    });

    test('populates the inputs with the entry values', () => {
        const html = renderForm();

        expect(html).toContain('value="Better Face Inside Your Face"');
        expect(html).toContain('type="date"');
        expect(html).toContain('value="2026-06-15"');
        expect(html).toContain('value="19:00\u201321:00"');
        expect(html).toContain('value="Shanghai"');
        expect(html).toContain('value="/images/events/2026-06-15.webp"');
        expect(html).toContain('Modern beauty culture is increasingly shaped by social media');
    });

    test('selects the entry level and offers every option', () => {
        const html = renderForm();

        expect(html).toContain('<option value="">None</option>');
        expect(html).toMatch(/<option (?=[^>]*selected="")[^>]*value="Advanced"[^>]*>Advanced<\/option>/);
        expect(html.split('selected=""').length - 1).toBe(1);

        for (const level of LEVELS) expect(html).toMatch(new RegExp(`<option [^>]*value="${level}"[^>]*>${level}</option>`));
    });

    test('annotates labels with required markers and suffixes', () => {
        const html = renderForm();

        expect(html).toContain('>Title<');
        expect(html).toContain('>Who<');
        expect(html).toContain('\u00B7 Markdown');
        expect(html.split('> *</span>').length - 1).toBe(5);
        expect(html).toContain('rows="9"');
    });

    test('renders the create mode with empty fields and no delete action', () => {
        const html = renderForm({ editingId: 'new', form: EMPTY_FORM });

        expect(html).toContain('>New event</h1>');
        expect(html).toContain('aria-label="Create event"');
        expect(html).toContain('>Create event</button>');
        expect(html).not.toContain('Delete event');
        expect(html.split('value=""').length - 1).toBeGreaterThanOrEqual(4);
    });

    test('renders error messages wired to their fields', () => {
        const html = renderForm({ formErrors: { cover: true, time: true, title: true } });

        expect(html).toContain('Title is required.');
        expect(html).toContain('Time must be a 24-hour range.');
        expect(html).toContain('Cover must be a URL or internal image path.');
        expect(html).toContain('id="error-event-title"');
        expect(html).toContain('aria-describedby="error-event-cover"');
        expect(html.split('dashboard-input--error').length - 1).toBe(3);
    });

    test('omits error messages when there are no errors', () => {
        const html = renderForm();

        expect(html).not.toContain('dashboard-input--error');
        expect(html).not.toContain('Title is required.');
    });

    test('lays paired fields side by side on desktop only', () => {
        const desktop = renderForm();
        const mobile = renderForm({ isMobile: true });

        expect(desktop).toContain('grid-template-columns:1fr 1fr');
        expect(mobile).not.toContain('grid-template-columns:1fr 1fr');
    });

    test('disables all actions and shows a spinner while saving', () => {
        const html = renderForm({ isSaving: true });

        expect(html).toContain('dashboard__spin');
        expect(html.split('disabled=""').length - 1).toBe(3);
        expect(html).not.toContain('>Save changes</button>');
    });
});
