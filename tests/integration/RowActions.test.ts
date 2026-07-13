import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import RowActions from '../../src/components/dashboard/RowActions';

import type { ReactElement } from 'react';

type ButtonProps = {
    onClick: () => void;
};

function renderActions(isMobile: boolean) {
    return renderToStaticMarkup(createElement(RowActions, { isMobile, onDelete: vi.fn(), onEdit: vi.fn() }));
}

describe('RowActions', () => {
    test('renders edit and delete buttons', () => {
        const html = renderActions(false);

        expect(html).toContain('class="dashboard-button dashboard-button--outline"');
        expect(html).toContain('>Edit</button>');
        expect(html).toContain('class="dashboard-button dashboard-button--danger"');
        expect(html).toContain('>Delete</button>');
    });

    test('renders a compact table cell on desktop', () => {
        const html = renderActions(false);

        expect(html).toContain('role="cell"');
        expect(html).toContain('padding:7px 12px');
        expect(html).toContain('width:66px');
    });

    test('drops the cell role and stretches buttons on mobile', () => {
        const html = renderActions(true);

        expect(html).not.toContain('role=');
        expect(html).toContain('flex:1');
        expect(html).toContain('padding:14px 12px');
    });

    test('wires the buttons to their handlers', () => {
        const handleDelete = vi.fn();
        const handleEdit = vi.fn();
        const tree = RowActions({ isMobile: false, onDelete: handleDelete, onEdit: handleEdit });
        const [editButton, deleteButton] = tree.props.children as ReactElement<ButtonProps>[];

        editButton.props.onClick();

        expect(handleEdit).toHaveBeenCalledTimes(1);
        expect(handleDelete).not.toHaveBeenCalled();

        deleteButton.props.onClick();

        expect(handleDelete).toHaveBeenCalledTimes(1);
    });
});
