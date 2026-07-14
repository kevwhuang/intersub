import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import Events from '../../src/sections/Events.astro';
import { LEVELS } from '../../src/lib/constants';
import { formatDate } from '../../src/lib/utils';

const EVENTS_DIR = fileURLToPath(new URL('../../src/content/events', import.meta.url));
const FILTER_GROUPS = ['When', 'Where', 'Who'] as const;
const LEVEL_FILTERS = ['all', ...LEVELS] as const;
const SUBTITLE = 'Our business English community regularly hosts seminars, hands-on workshops, and group discussions centered on practical workplace communication and industry topics. Through structured English improvement marathons and real-world business projects, we support members at every stage, helping them build their skills through consistent micro-learning, systematic development, and practical application in professional contexts.';
const TIMING_FILTERS = ['all', 'upcoming', 'past'] as const;

const events = readdirSync(EVENTS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
        id: file.replace('.json', ''),
        ...JSON.parse(readFileSync(join(EVENTS_DIR, file), 'utf-8')) as Omit<AdminEvent, 'id'>,
    }))
    .sort((entryA, entryB) => entryB.date.localeCompare(entryA.date));

const coveredEvents = events.filter(event => event.cover);
const leveledEvents = events.filter(event => event.level);
const locations = [...new Set(events.map(event => event.location))].sort();
const timedEvents = events.filter(event => event.time);
const uncoveredEvents = events.filter(event => !event.cover);

const locationFilters = ['all', ...locations];

describe('Events', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Events);
    });

    test('renders the hero title and subtitle', () => {
        expect(html).toContain('<h1 id="events-title" class="events__title" data-i18n="Events" data-scroll');
        expect(html).toContain('>Events</h1>');
        expect(html).toContain(`data-i18n="${SUBTITLE}"`);
        expect(html.split(SUBTITLE).length - 1).toBe(2);
    });

    test('renders timing, location, and level filter chips under when, where, and who labels', () => {
        for (const group of FILTER_GROUPS) {
            expect(html).toContain(`<p class="events__filter-label" data-i18n="${group}"`);
            expect(html).toContain(`>${group}</p>`);
        }

        for (const timing of TIMING_FILTERS) {
            expect(html).toContain(`data-filter-timing="${timing}"`);
        }

        for (const location of locationFilters) {
            expect(html).toContain(`data-filter-location="${location}"`);
        }

        for (const level of LEVEL_FILTERS) {
            expect(html).toContain(`data-filter-level="${level}"`);
        }

        expect(html.split('data-filter-timing=').length - 1).toBe(TIMING_FILTERS.length);
        expect(html.split('data-filter-location=').length - 1).toBe(locationFilters.length);
        expect(html.split('data-filter-level=').length - 1).toBe(LEVEL_FILTERS.length);
    });

    test('labels the catch-all chips and derives location chips from content', () => {
        for (const label of ['All', 'Everywhere', 'Everyone', ...locations]) {
            expect(html).toContain(`<span data-i18n="${label}"`);
            expect(html).toContain(`>${label}</span>`);
        }
    });

    test('marks the all chips active by default', () => {
        expect(html).toContain('class="chip chip--active" data-filter-timing="all"');
        expect(html).toContain('class="chip chip--active" data-filter-location="all"');
        expect(html).toContain('class="chip chip--active" data-filter-level="all"');
    });

    test('renders the events count', () => {
        expect(html).toContain('data-count');
        expect(html).toContain(`${events.length} ${events.length === 1 ? 'event' : 'events'}`);
    });

    test('renders one card per event sorted newest first', () => {
        const dates = [...html.matchAll(/data-card-date="([^"]*)"/g)].map(match => match[1]);

        expect(html.split('class="events__card"').length - 1).toBe(events.length);
        expect(dates).toEqual(events.map(event => event.date));
    });

    test('renders the title, date, and location on each card with a time row only when timed', () => {
        for (const event of events) {
            expect(html).toContain(`>${event.title}</h2>`);
            expect(html).toContain(`datetime="${event.date}"`);
            expect(html).toContain(`>${formatDate(event.date)}</time>`);
            expect(html).toContain(`>${event.location}</dd>`);

            if (event.time) expect(html).toContain(`>${event.time}</dd>`);
        }

        expect(html.split('data-i18n="Time"').length - 1).toBe(timedEvents.length);
    });

    test('renders a level chip only for events with a level', () => {
        expect(html.split('events__card-badge').length - 1).toBe(leveledEvents.length);

        for (const event of leveledEvents) {
            expect(html).toContain(`data-card-level="${event.level}"`);
            expect(html).toContain(`class="tag tag--${String(event.level).toLowerCase()}"`);
        }
    });

    test('renders a cover image for each event with a cover', () => {
        expect(html.split('class="events__card-image"').length - 1).toBe(coveredEvents.length);

        for (const event of coveredEvents) {
            const coverName = String(event.cover).split('/').at(-1) ?? '';

            expect(html).toContain(coverName);
        }
    });

    test('renders the initials fallback only for events without a cover', () => {
        expect(html.split('events__card-initials').length - 1).toBe(uncoveredEvents.length);
    });

    test('links each card to its event page', () => {
        for (const event of events) {
            expect(html).toContain(`href="/events/${event.date}"`);
        }
    });
});
