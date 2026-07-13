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
        onNewEvent: vi.fn(),
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

        expect(html).toContain('<button class="chip chip--active">All</button>');
        expect(html).toContain('<button class="chip">Upcoming</button>');
        expect(html).toContain('<button class="chip">Past</button>');
    });

    test('renders location chips from the locations prop', () => {
        const html = renderChips();

        expect(html).toContain('<button class="chip chip--active">Everywhere</button>');
        expect(html).toContain('<button class="chip">Shanghai</button>');
    });

    test('renders a chip for every level', () => {
        const html = renderChips();

        expect(html).toContain('<button class="chip chip--active">Everyone</button>');
        expect(html).toContain('<button class="chip">Beginner</button>');
        expect(html).toContain('<button class="chip">Intermediate</button>');
        expect(html).toContain('<button class="chip">Advanced</button>');
        expect(html).toContain('<button class="chip">Cohort</button>');
    });

    test('highlights one active chip per group', () => {
        const html = renderChips({ activeLevel: 'Advanced', activeLocation: 'Shanghai', activeTiming: 'past' });

        expect(html.split('chip--active').length - 1).toBe(3);
        expect(html).toContain('<button class="chip chip--active">Past</button>');
        expect(html).toContain('<button class="chip chip--active">Shanghai</button>');
        expect(html).toContain('<button class="chip chip--active">Advanced</button>');
        expect(html).toContain('<button class="chip">All</button>');
        expect(html).toContain('<button class="chip">Everywhere</button>');
        expect(html).toContain('<button class="chip">Everyone</button>');
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
        expect(props.onNewEvent).toHaveBeenCalledTimes(1);
    });
});
