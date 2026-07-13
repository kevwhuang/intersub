import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Solutions from '../../src/sections/Solutions.astro';

const SOLUTIONS = [
    {
        details: [
            { label: 'Format', value: 'Private 1:1' },
            { label: 'Details', value: '120 min/week' },
            { label: 'Best for', value: 'Adults with clear needs' },
        ],
        title: '1:1 Coaching',
    },
    {
        details: [
            { label: 'Format', value: 'On-site or remote' },
            { label: 'Details', value: '6\u201314/cohort \u00B7 60\u2013120 min/week' },
            { label: 'Best for', value: 'Functional teams' },
        ],
        title: 'Team Workshops &amp; Course Sessions',
    },
    {
        details: [
            { label: 'Format', value: 'Small to medium groups' },
            { label: 'Details', value: 'Beginner to advanced' },
            { label: 'Best for', value: 'People interested in related topics' },
        ],
        title: 'Co-Created Events',
    },
] as const;

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('Solutions', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Solutions);
    });

    test('wires the section to a rendered heading id via aria-labelledby', () => {
        expect(html).toContain('aria-labelledby="solutions-title"');
        expect(html).toMatch(/<h2 id="solutions-title"[^>]*data-i18n="Solutions"/);
    });

    test('renders the intro with an i18n hook', () => {
        expect(html).toContain('data-i18n="Three formats, each built around your real situations: the meetings you run, the clients you email, the rooms you need to win."');
    });

    test('renders three solution cards with titles in order', () => {
        expect(html.split('<article class="solutions__card"').length - 1).toBe(SOLUTIONS.length);

        const positions = SOLUTIONS.map(solution => html.indexOf(`data-i18n="${solution.title}"`));

        expect(positions.every(position => position >= 0)).toBe(true);
        expect(positions).toEqual([...positions].sort((positionA, positionB) => positionA - positionB));
    });

    test('renders every detail as a dt/dd pair with i18n hooks', () => {
        for (const solution of SOLUTIONS) {
            for (const detail of solution.details) {
                expect(html).toMatch(new RegExp(`<dt[^>]*data-i18n="${escapeRegExp(detail.label)}"[^>]*>[^<]*</dt>\\s*<dd[^>]*data-i18n="${escapeRegExp(detail.value)}"`));
            }
        }
    });

    test('renders detail lists with dl/dt/dd semantics', () => {
        expect(html.split('<dl').length - 1).toBe(SOLUTIONS.length);
        expect(html.split('<dt').length - 1).toBe(9);
        expect(html.split('<dd').length - 1).toBe(9);
    });

    test('renders the beginner to advanced level range', () => {
        expect(html.split('Beginner to advanced').length - 1).toBe(2);
    });

    test('marks the header and staggers the card list for scroll animation', () => {
        expect(html).toMatch(/<div class="solutions__header" data-scroll/);
        expect(html).toMatch(/<div class="solutions__list[^"]*" data-scroll data-scroll-stagger="0.12"/);
    });
});
