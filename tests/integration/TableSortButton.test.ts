import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import TableSortButton from '../../src/components/dashboard/TableSortButton';

import type { ReactElement } from 'react';

type ButtonProps = {
    onClick: () => void;
};

function renderButton(sortDirection: 'asc' | 'desc', sortKey: string) {
    return renderToStaticMarkup(createElement(TableSortButton, {
        field: 'date',
        label: 'Date',
        onSort: vi.fn(),
        sortDirection,
        sortKey,
    }));
}

describe('TableSortButton', () => {
    test('renders a ghost button inside a column header', () => {
        const html = renderButton('asc', 'title');

        expect(html).toContain('role="columnheader"');
        expect(html).toContain('class="dashboard-button dashboard-button--ghost"');
        expect(html).toContain('type="button"');
        expect(html).toContain('text-transform:uppercase');
        expect(html).toContain('font-family:var(--font-mono)');
    });

    test('shows no arrow and no sort state while inactive', () => {
        const html = renderButton('asc', 'title');

        expect(html).toContain('aria-sort="none"');
        expect(html).toContain('>Date</button>');
    });

    test('shows an up arrow while sorting ascending', () => {
        const html = renderButton('asc', 'date');

        expect(html).toContain('aria-sort="ascending"');
        expect(html).toContain('>Date \u2191</button>');
    });

    test('shows a down arrow while sorting descending', () => {
        const html = renderButton('desc', 'date');

        expect(html).toContain('aria-sort="descending"');
        expect(html).toContain('>Date \u2193</button>');
    });

    test('sorts by its own field on click', () => {
        const handleSort = vi.fn();
        const tree = TableSortButton({ field: 'date', label: 'Date', onSort: handleSort, sortDirection: 'asc', sortKey: 'title' });
        const button = tree.props.children as ReactElement<ButtonProps>;

        button.props.onClick();

        expect(handleSort).toHaveBeenCalledTimes(1);
        expect(handleSort).toHaveBeenCalledWith('date');
    });
});
