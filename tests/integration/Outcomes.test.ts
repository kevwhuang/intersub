import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import Outcomes from '../../src/sections/Outcomes.astro';

const OUTCOMES_DIR = fileURLToPath(new URL('../../src/content/outcomes', import.meta.url));

const outcomes = readdirSync(OUTCOMES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
        id: file.replace('.json', ''),
        ...JSON.parse(readFileSync(join(OUTCOMES_DIR, file), 'utf-8')) as Omit<AdminOutcome, 'id'>,
    }))
    .sort((entryA, entryB) => Number(entryA.id) - Number(entryB.id));

function escapeText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

describe('Outcomes', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Outcomes);
    });

    test('wires the section to a rendered heading id via aria-labelledby', () => {
        expect(html).toMatch(/<section[^>]*aria-labelledby="outcomes-title"/);
        expect(html).toMatch(/<h2 id="outcomes-title"[^>]*data-i18n="Outcomes"[^>]*>Outcomes<\/h2>/);
    });

    test('renders one card per outcome sorted by numeric id', () => {
        const titles = [...html.matchAll(/<h3 class="outcomes__card-title" data-i18n="([^"]*)"/g)].map(match => match[1]);

        expect(html.split('class="outcomes__card"').length - 1).toBe(outcomes.length);
        expect(titles).toEqual(outcomes.map(outcome => outcome.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;')));
    });

    test('renders each title and summary', () => {
        for (const outcome of outcomes) {
            expect(html).toContain(`>${escapeText(outcome.title)}</h3>`);
            expect(html).toContain(`>${escapeText(outcome.summary)}</p>`);
        }
    });

    test('renders every point as a list item', () => {
        const totalPoints = outcomes.reduce((total, outcome) => total + outcome.points.length, 0);

        expect(html.split('class="outcomes__points"').length - 1).toBe(outcomes.length);
        expect(html.split('class="outcomes__point"').length - 1).toBe(totalPoints);

        for (const outcome of outcomes) {
            for (const point of outcome.points) {
                expect(html).toContain(`>${escapeText(point)}</li>`);
            }
        }
    });

    test('marks the header and staggers the grid for scroll animation', () => {
        expect(html).toMatch(/<div class="outcomes__header" data-scroll[^>]*>/);
        expect(html).toMatch(/<div class="outcomes__grid" data-scroll data-scroll-stagger="0\.1"[^>]*>/);
    });
});
