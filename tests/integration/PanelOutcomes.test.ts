import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import PanelOutcomes from '../../src/components/dashboard/PanelOutcomes';
import outcomeCalls from '../../src/content/outcomes/1.json';
import outcomePresence from '../../src/content/outcomes/2.json';

type PanelProps = Parameters<typeof PanelOutcomes>[0];

const OUTCOMES: AdminOutcome[] = [
    { ...outcomeCalls, id: '1' },
    { ...outcomePresence, id: '2' },
];

function renderPanel(overrides: Partial<PanelProps> = {}) {
    return renderToStaticMarkup(createElement(PanelOutcomes, {
        editingOutcomeId: null,
        isMobile: false,
        isSaving: false,
        onCancelEdit: vi.fn(),
        onRequestDelete: vi.fn(),
        onSave: vi.fn(),
        onSort: vi.fn(),
        onStartEdit: vi.fn(),
        onStartNew: vi.fn(),
        onUpdate: vi.fn(),
        outcomeForm: null,
        outcomeFormErrors: {},
        outcomes: OUTCOMES,
        sortDirection: 'asc',
        sortKey: 'title',
        ...overrides,
    }));
}

describe('PanelOutcomes', () => {
    test('renders the heading with the entry count and new button', () => {
        const html = renderPanel();

        expect(html).toContain('>Outcomes</h1>');
        expect(html).toContain('2 outcomes');
        expect(html).toContain('+\u2002New outcome');
    });

    test('uses the singular label for a single outcome', () => {
        const html = renderPanel({ outcomes: [OUTCOMES[0]] });

        expect(html).toContain('1 outcome');
        expect(html).not.toContain('1 outcomes');
    });

    test('renders a table with sortable column headers on desktop', () => {
        const html = renderPanel();

        expect(html).toContain('aria-label="Outcomes"');
        expect(html).toContain('role="table"');
        expect(html).toContain('>Title \u2191</button>');
        expect(html).toContain('>Summary</button>');
        expect(html).toContain('>Outcomes</span>');
        expect(html).toContain('>Actions</span>');
        expect(html.split('role="columnheader"').length - 1).toBe(4);
        expect(html.split('dashboard-button--ghost').length - 1).toBe(2);
    });

    test('marks only the sorted column with an aria-sort direction', () => {
        const html = renderPanel({ sortDirection: 'desc', sortKey: 'summary' });

        expect(html).toContain('>Summary \u2193</button>');
        expect(html).toContain('>Title</button>');
        expect(html.split('aria-sort="descending"').length - 1).toBe(1);
        expect(html.split('aria-sort="none"').length - 1).toBe(1);
    });

    test('renders one row per outcome plus the header row', () => {
        const html = renderPanel();

        expect(html.split('role="row"').length - 1).toBe(3);
        expect(html).toContain('>Manufacturer \u00B7 client calls</p>');
        expect(html).toContain('>Chemicals \u00B7 executive presence</p>');
        expect(html).toContain('Sales and PMs avoided English calls with overseas clients');
        expect(html).toContain('Directors commanded rooms in Mandarin');
    });

    test('shows the point count for each outcome', () => {
        const html = renderPanel();

        expect(html.split('>4</span>').length - 1).toBe(2);
    });

    test('stacks rows without table semantics on mobile', () => {
        const html = renderPanel({ isMobile: true });

        expect(html).not.toContain('role="table"');
        expect(html).not.toContain('role="columnheader"');
        expect(html).toContain('>Manufacturer \u00B7 client calls</p>');
        expect(html.split('4 outcomes').length - 1).toBe(2);
    });

    test('shows the empty state when there are no outcomes', () => {
        const html = renderPanel({ outcomes: [] });

        expect(html).toContain('No outcomes found');
        expect(html).toContain('Try a different search, or add a new outcome.');
        expect(html).not.toContain('role="table"');
    });

    test('renders the edit form populated with the outcome values', () => {
        const html = renderPanel({
            editingOutcomeId: '1',
            outcomeForm: { points: outcomeCalls.points.join('\n'), summary: outcomeCalls.summary, title: outcomeCalls.title },
        });

        expect(html).toContain('>Edit outcome</h1>');
        expect(html).toContain('value="Manufacturer \u00B7 client calls"');
        expect(html).toContain('Sales and PMs avoided English calls with overseas clients');
        expect(html).toContain('Now lead client calls end-to-end in English');
        expect(html).toContain('aria-label="Save changes"');
        expect(html).toContain('>Delete outcome</button>');
    });

    test('renders the create form without a delete action', () => {
        const html = renderPanel({
            editingOutcomeId: 'new',
            outcomeForm: { points: '', summary: '', title: '' },
        });

        expect(html).toContain('>New outcome</h1>');
        expect(html).toContain('aria-label="Create outcome"');
        expect(html).not.toContain('Delete outcome');
    });

    test('renders validation errors against their fields', () => {
        const html = renderPanel({
            editingOutcomeId: 'new',
            outcomeForm: { points: '', summary: '', title: '' },
            outcomeFormErrors: { points: true, summary: true, title: true },
        });

        expect(html).toContain('Title is required.');
        expect(html).toContain('Summary is required.');
        expect(html).toContain('At least one outcome is required.');
        expect(html).toContain('id="error-outcome-title"');
        expect(html).toContain('aria-describedby="error-outcome-points"');
        expect(html.split('dashboard-input--error').length - 1).toBe(3);
    });
});
