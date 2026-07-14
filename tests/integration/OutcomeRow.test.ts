import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import OutcomeRow from '../../src/components/dashboard/OutcomeRow';
import outcomeCalls from '../../src/content/outcomes/1.json';

const OUTCOME: AdminOutcome = { ...outcomeCalls, id: '1' };

function renderRow(outcome: AdminOutcome, isMobile = false) {
    return renderToStaticMarkup(createElement(OutcomeRow, { isMobile, onDelete: vi.fn(), onEdit: vi.fn(), outcome }));
}

describe('OutcomeRow', () => {
    test('renders a desktop grid row with one cell per column', () => {
        const html = renderRow(OUTCOME);

        expect(html).toContain('role="row"');
        expect(html).toContain('grid-template-columns:1fr 2fr 82px 138px');
        expect(html.split('role="cell"').length - 1).toBe(4);
    });

    test('renders the outcome values in their cells', () => {
        const html = renderRow(OUTCOME);

        expect(html).toContain('>Manufacturer \u00B7 client calls</p>');
        expect(html).toContain('Sales and PMs avoided English calls with overseas clients, defaulting to email and slowing every deal.');
        expect(html).toContain('>4</span>');
    });

    test('renders edit and delete actions', () => {
        const html = renderRow(OUTCOME);

        expect(html).toContain('>Edit</button>');
        expect(html).toContain('>Delete</button>');
        expect(html.split('dashboard-button--danger').length - 1).toBe(1);
    });

    test('stacks the outcome as a card with a point count on mobile', () => {
        const html = renderRow(OUTCOME, true);

        expect(html).not.toContain('role="row"');
        expect(html).not.toContain('role="cell"');
        expect(html).toContain('>Manufacturer \u00B7 client calls</p>');
        expect(html).toContain('>4 outcomes</span>');
    });

    test('uses the singular label for a single point on mobile', () => {
        const html = renderRow({ ...OUTCOME, points: [OUTCOME.points[0]] }, true);

        expect(html).toContain('>1 outcome</span>');
        expect(html).not.toContain('1 outcomes');
    });
});
