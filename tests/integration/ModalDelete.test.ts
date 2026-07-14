import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import ModalDelete from '../../src/components/ModalDelete';

const deletingHtml = renderToStaticMarkup(createElement(ModalDelete, {
    isDeleting: true,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    title: 'From Expansion to Integration',
}));

const html = renderToStaticMarkup(createElement(ModalDelete, {
    isDeleting: false,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    title: 'From Expansion to Integration',
}));

describe('ModalDelete', () => {
    test('renders an accessible modal dialog', () => {
        expect(html).toContain('role="dialog"');
        expect(html).toContain('aria-modal="true"');
        expect(html).toContain('aria-labelledby="delete-modal-title"');
        expect(html).toContain('aria-describedby="delete-modal-text"');
    });

    test('renders the confirmation heading', () => {
        expect(html).toContain('<h2 id="delete-modal-title"');
        expect(html).toContain('Delete this item?</h2>');
    });

    test('names the item in the warning text', () => {
        expect(html).toContain('<p id="delete-modal-text"');
        expect(html).toContain('\u201CFrom Expansion to Integration\u201D will be permanently deleted. This cannot be undone.');
    });

    test('renders cancel and delete actions', () => {
        expect(html).toContain('class="dashboard-button dashboard-button--outline"');
        expect(html).toContain('>Cancel</button>');
        expect(html).toContain('class="dashboard-button dashboard-button--danger dashboard-button--danger-solid"');
        expect(html).toContain('>Delete</button>');
    });

    test('overlays the screen behind the dialog', () => {
        expect(html).toContain('position:fixed');
        expect(html).toContain('z-index:60');
        expect(html).toContain('background:var(--color-slate-45)');
    });

    test('disables both actions and swaps the delete label for a spinner while deleting', () => {
        expect(deletingHtml.split('disabled=""').length - 1).toBe(2);
        expect(deletingHtml).toContain('dashboard__spin');
        expect(deletingHtml).not.toContain('>Delete</button>');
        expect(html).not.toContain('disabled=""');
    });
});
