import { createElement, isValidElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import FilterChips from '../../src/components/dashboard/FilterChips';

import type { ReactElement, ReactNode } from 'react';

type ChipProps = {
    children?: ReactNode;
    onClick?: () => void;
};

type FilterChipsProps = Parameters<typeof FilterChips>[0];

function buildProps(overrides: Partial<FilterChipsProps> = {}): FilterChipsProps {
    return {
        activeLevel: 'all',
        activeLocation: 'all',
        activeTiming: 'all',
        locations: ['Shanghai'],
        onLevelChange: vi.fn(),
        onLocationChange: vi.fn(),
        onStartNew: vi.fn(),
        onTimingChange: vi.fn(),
        ...overrides,
    };
}

function collectButtons(node: ReactNode): ReactElement<ChipProps>[] {
    if (Array.isArray(node)) return node.flatMap(child => collectButtons(child as ReactNode));

    if (!isValidElement(node)) return [];

    const element = node as ReactElement<ChipProps>;
    const nested = collectButtons(element.props.children);

    return element.type === 'button' ? [element, ...nested] : nested;
}

function renderChips(overrides: Partial<FilterChipsProps> = {}) {
    return renderToStaticMarkup(createElement(FilterChips, buildProps(overrides)));
}

describe('FilterChips', () => {
    test('renders the three filter groups', () => {
        const html = renderChips();

        expect(html).toContain('>When</p>');
        expect(html).toContain('>Where</p>');
        expect(html).toContain('>Who</p>');
        expect(html).toContain('text-transform:uppercase');
    });

    test('renders timing chips with all selected by default', () => {
        const html = renderChips();

        expect(html).toContain('<button class="chip chip--active" type="button">All</button>');
        expect(html).toContain('<button class="chip" type="button">Upcoming</button>');
        expect(html).toContain('<button class="chip" type="button">Past</button>');
    });

    test('renders location chips from the locations prop', () => {
        const html = renderChips();

        expect(html).toContain('<button class="chip chip--active" type="button">Everywhere</button>');
        expect(html).toContain('<button class="chip" type="button">Shanghai</button>');
    });

    test('renders a chip for every level', () => {
        const html = renderChips();

        expect(html).toContain('<button class="chip chip--active" type="button">Everyone</button>');
        expect(html).toContain('<button class="chip" type="button">Beginner</button>');
        expect(html).toContain('<button class="chip" type="button">Intermediate</button>');
        expect(html).toContain('<button class="chip" type="button">Advanced</button>');
        expect(html).toContain('<button class="chip" type="button">Cohort</button>');
    });

    test('highlights one active chip per group', () => {
        const html = renderChips({ activeLevel: 'Advanced', activeLocation: 'Shanghai', activeTiming: 'past' });

        expect(html.split('chip--active').length - 1).toBe(3);
        expect(html).toContain('<button class="chip chip--active" type="button">Past</button>');
        expect(html).toContain('<button class="chip chip--active" type="button">Shanghai</button>');
        expect(html).toContain('<button class="chip chip--active" type="button">Advanced</button>');
        expect(html).toContain('<button class="chip" type="button">All</button>');
        expect(html).toContain('<button class="chip" type="button">Everywhere</button>');
        expect(html).toContain('<button class="chip" type="button">Everyone</button>');
    });

    test('renders the new event action', () => {
        const html = renderChips();

        expect(html).toContain('class="dashboard-button dashboard-button--primary"');
        expect(html).toContain('+\u2002New event</button>');
    });

    test('wires every chip group and the new event button to its handler', () => {
        const props = buildProps();
        const buttons = collectButtons(FilterChips(props));

        expect(buttons).toHaveLength(11);

        buttons[1].props.onClick?.();
        buttons[4].props.onClick?.();
        buttons[6].props.onClick?.();
        buttons[10].props.onClick?.();

        expect(props.onTimingChange).toHaveBeenCalledWith('upcoming');
        expect(props.onLocationChange).toHaveBeenCalledWith('Shanghai');
        expect(props.onLevelChange).toHaveBeenCalledWith('Beginner');
        expect(props.onStartNew).toHaveBeenCalledTimes(1);
    });
});
