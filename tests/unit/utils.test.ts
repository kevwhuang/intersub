import { afterEach, describe, expect, test, vi } from 'vitest';

import { FOCUSABLE_SELECTOR } from '../../src/lib/constants';
import { formatDate, getInitials, getLevelMeta, getToday, parseDate, trapTabKey } from '../../src/lib/utils';

import type { Mock } from 'vitest';

interface FocusTarget {
    focus: Mock<() => void>;
}

const FALLBACK_META = {
    background: 'var(--color-silver)',
    cover: 'var(--color-silver-light)',
    foreground: 'var(--color-slate-muted)',
    ink: 'var(--color-slate-muted)',
} as const;

const LEVEL_EXPECTATIONS = {
    Advanced: {
        background: 'var(--color-rose)',
        cover: 'var(--color-rose-cover)',
        foreground: 'var(--color-crimson)',
        ink: 'var(--color-crimson)',
    },
    Beginner: {
        background: 'var(--color-mint)',
        cover: 'var(--color-mint-cover)',
        foreground: 'var(--color-teal)',
        ink: 'var(--color-teal)',
    },
    Cohort: {
        background: 'var(--color-cobalt-10)',
        cover: 'var(--color-cobalt-10)',
        foreground: 'var(--color-cobalt)',
        ink: 'var(--color-cobalt)',
    },
    Intermediate: {
        background: 'var(--color-cream)',
        cover: 'var(--color-cream-cover)',
        foreground: 'var(--color-amber)',
        ink: 'var(--color-amber)',
    },
} as const;

function buildFocusTarget(): FocusTarget {
    return { focus: vi.fn() };
}

function runTrapTabKey(shiftKey: boolean, targets: FocusTarget[], activeElement: unknown) {
    const container = {
        contains: (node: unknown) => targets.includes(node as FocusTarget),
        querySelectorAll: vi.fn(() => targets),
    };
    const event = { preventDefault: vi.fn(), shiftKey };

    vi.stubGlobal('document', { activeElement });
    trapTabKey(event as unknown as KeyboardEvent, container as unknown as HTMLElement);

    return { container, event };
}

describe('formatDate', () => {
    test('formats an iso date as a short us date', () => {
        expect(formatDate('2026-06-15')).toBe('Jun 15, 2026');
        expect(formatDate('2026-12-01')).toBe('Dec 1, 2026');
    });

    test('returns an empty string for an empty input', () => {
        expect(formatDate('')).toBe('');
    });

    test('returns the input unchanged when it cannot be parsed', () => {
        expect(formatDate('not-a-date')).toBe('not-a-date');
    });
});

describe('getInitials', () => {
    test('takes the first letter of each of the first two words', () => {
        expect(getInitials('Business English')).toBe('BE');
    });

    test('ignores words beyond the first two', () => {
        expect(getInitials('Negotiation Skills Workshop')).toBe('NS');
    });

    test('returns a single initial for a single word', () => {
        expect(getInitials('Workshop')).toBe('W');
    });

    test('uppercases lowercase words', () => {
        expect(getInitials('public speaking')).toBe('PS');
    });
});

describe('getLevelMeta', () => {
    test('returns the palette for each known level', () => {
        for (const [level, meta] of Object.entries(LEVEL_EXPECTATIONS)) expect(getLevelMeta(level)).toEqual(meta);
    });

    test('returns the neutral fallback for an unknown level', () => {
        expect(getLevelMeta('Expert')).toEqual(FALLBACK_META);
        expect(getLevelMeta('')).toEqual(FALLBACK_META);
    });
});

describe('getToday', () => {
    test('returns an iso calendar date string', () => {
        expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('matches the current date in shanghai', () => {
        const expected = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());

        expect(getToday()).toBe(expected);
    });
});

describe('parseDate', () => {
    test('returns a local-midnight date', () => {
        const date = parseDate('2026-06-15');

        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(5);
        expect(date.getDate()).toBe(15);
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
    });

    test('produces nan time for an invalid string', () => {
        expect(Number.isNaN(parseDate('not-a-date').getTime())).toBe(true);
    });
});

describe('trapTabKey', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('queries the container with the shared focusable selector', () => {
        const { container } = runTrapTabKey(false, [], null);

        expect(container.querySelectorAll).toHaveBeenCalledExactlyOnceWith(FOCUSABLE_SELECTOR);
    });

    test('wraps a forward tab from the last target to the first', () => {
        const targets = [buildFocusTarget(), buildFocusTarget(), buildFocusTarget()];

        const { event } = runTrapTabKey(false, targets, targets[2]);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(targets[0].focus).toHaveBeenCalledTimes(1);
        expect(targets[2].focus).not.toHaveBeenCalled();
    });

    test('pulls a forward tab into the first target when focus is outside the container', () => {
        const targets = [buildFocusTarget(), buildFocusTarget()];

        const { event } = runTrapTabKey(false, targets, buildFocusTarget());

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(targets[0].focus).toHaveBeenCalledTimes(1);
        expect(targets[1].focus).not.toHaveBeenCalled();
    });

    test('lets a forward tab move on from a non-terminal target inside the container', () => {
        const targets = [buildFocusTarget(), buildFocusTarget()];

        const { event } = runTrapTabKey(false, targets, targets[0]);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(targets[0].focus).not.toHaveBeenCalled();
        expect(targets[1].focus).not.toHaveBeenCalled();
    });

    test('wraps a shift tab from the first target to the last', () => {
        const targets = [buildFocusTarget(), buildFocusTarget(), buildFocusTarget()];

        const { event } = runTrapTabKey(true, targets, targets[0]);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(targets[2].focus).toHaveBeenCalledTimes(1);
        expect(targets[0].focus).not.toHaveBeenCalled();
    });

    test('pulls a shift tab into the last target when focus is outside the container', () => {
        const targets = [buildFocusTarget(), buildFocusTarget()];

        const { event } = runTrapTabKey(true, targets, null);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(targets[1].focus).toHaveBeenCalledTimes(1);
        expect(targets[0].focus).not.toHaveBeenCalled();
    });

    test('lets a shift tab move on from a non-terminal target inside the container', () => {
        const targets = [buildFocusTarget(), buildFocusTarget()];

        const { event } = runTrapTabKey(true, targets, targets[1]);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(targets[0].focus).not.toHaveBeenCalled();
        expect(targets[1].focus).not.toHaveBeenCalled();
    });

    test('prevents default without focusing when the container has no targets', () => {
        const { event } = runTrapTabKey(true, [], null);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });
});
