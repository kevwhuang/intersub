import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import TopBar from '../../src/components/dashboard/TopBar';

import type { ReactElement, ReactNode } from 'react';

type TopBarProps = Parameters<typeof TopBar>[0];

interface SearchInputProps {
    onChange: (event: { target: { value: string } }) => void;
}

function renderTopBar(overrides: Partial<TopBarProps> = {}) {
    return renderToStaticMarkup(createElement(TopBar, {
        isDrawerOpen: true,
        onSearchChange: vi.fn(),
        onToggleDrawer: vi.fn(),
        searchValue: '',
        ...overrides,
    }));
}

describe('TopBar', () => {
    test('renders the drawer toggle reflecting the open state', () => {
        const html = renderTopBar();

        expect(html).toContain('aria-label="Toggle navigation"');
        expect(html).toContain('aria-expanded="true"');
        expect(html).toContain('dashboard-button--ghost');
    });

    test('marks the toggle collapsed when the drawer is closed', () => {
        const html = renderTopBar({ isDrawerOpen: false });

        expect(html).toContain('aria-expanded="false"');
    });

    test('renders the search input with the current value', () => {
        const html = renderTopBar({ searchValue: 'workshop' });

        expect(html).toContain('<span class="sr-only">Search</span>');
        expect(html).toContain('placeholder="Search\u2026"');
        expect(html).toContain('value="workshop"');
        expect(html).toContain('class="dashboard-input"');
    });

    test('sticks to the top of the viewport', () => {
        const html = renderTopBar();

        expect(html).toContain('position:sticky');
        expect(html).toContain('top:0');
        expect(html).toContain('height:60px');
    });

    test('hides the toggle glyph from assistive tech', () => {
        const html = renderTopBar();

        expect(html).toContain('aria-hidden="true"');
    });

    test('wires the toggle and search input to their handlers', () => {
        const onSearchChange = vi.fn();
        const onToggleDrawer = vi.fn();

        const tree = TopBar({ isDrawerOpen: true, onSearchChange, onToggleDrawer, searchValue: '' });

        const [toggle, label] = tree.props.children as [ReactElement<ButtonProps>, ReactElement<{ children: ReactNode[] }>];

        toggle.props.onClick();

        expect(onToggleDrawer).toHaveBeenCalledTimes(1);
        expect(onSearchChange).not.toHaveBeenCalled();

        const [, input] = label.props.children as [ReactNode, ReactElement<SearchInputProps>];

        input.props.onChange({ target: { value: 'workshop' } });

        expect(onSearchChange).toHaveBeenCalledWith('workshop');
    });
});
