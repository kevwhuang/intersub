import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import EventDetail from '../../src/sections/EventDetail.astro';
import { formatDate, getInitials, getLevelMeta } from '../../src/lib/utils';

const EVENTS_DIR = fileURLToPath(new URL('../../src/content/events', import.meta.url));
const META_LABELS = ['Date', 'Time', 'Location', 'Who'] as const;
const SAMPLE_CONTENT = 'Intro paragraph.\n\n## Focus\n- Point one\n- Point two\n\nClosing paragraph.';
const UNRESOLVED_COVER = '/images/events/unassigned.webp';

const events = readdirSync(EVENTS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
        id: file.replace('.json', ''),
        ...JSON.parse(readFileSync(join(EVENTS_DIR, file), 'utf-8')) as Omit<AdminEvent, 'id'>,
    }));

const [event] = events.filter(entry => Boolean(entry.cover && entry.level && entry.time));

const contentLines = event.content.split('\n').map(line => line.trim()).filter(Boolean);
const coverName = String(event.cover).split('/').at(-1) ?? '';
const levelMeta = getLevelMeta(event.level ?? '');

const headingLines = contentLines.filter(line => line.startsWith('## '));
const listLines = contentLines.filter(line => line.startsWith('- '));
const paragraphLines = contentLines.filter(line => !line.startsWith('## ') && !line.startsWith('- '));

describe('EventDetail', () => {
    let fallbackHtml: string;
    let html: string;
    let unresolvedHtml: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        fallbackHtml = await container.renderToString(EventDetail, { props: { event: { ...event, content: SAMPLE_CONTENT, cover: undefined, level: undefined, time: '' } } });
        html = await container.renderToString(EventDetail, { props: { event } });
        unresolvedHtml = await container.renderToString(EventDetail, { props: { event: { ...event, cover: UNRESOLVED_COVER } } });
    });

    test('renders the back link to the events index', () => {
        expect(html).toContain('class="event-detail__back" href="/events"');
        expect(html).toMatch(/<span data-i18n="All events"[^>]*>All events<\/span>/);
    });

    test('renders the event title as the headline', () => {
        expect(html).toMatch(/<h1 class="event-detail__title" data-scroll[^>]*>/);
        expect(html).toContain(`>${event.title}</h1>`);
    });

    test('renders date, time, location, and who meta rows', () => {
        for (const label of META_LABELS) {
            expect(html).toContain(`class="event-detail__meta-label" data-i18n="${label}"`);
        }

        expect(html).toContain(`<time data-i18n-date="${event.date}" datetime="${event.date}"`);
        expect(html).toContain(`>${formatDate(event.date)}</time>`);
        expect(html).toContain(`>${event.time}</dd>`);
        expect(html).toContain(`data-i18n="${event.location}"`);
        expect(html).toContain(`>${event.location}</dd>`);
        expect(html).toMatch(new RegExp(`data-i18n="${event.level}"[^>]*>${event.level}</dd>`));
    });

    test('omits the time row and addresses everyone without time and level', () => {
        expect(fallbackHtml.split('data-i18n="Time"').length - 1).toBe(0);
        expect(fallbackHtml).toMatch(/data-i18n="Everyone"[^>]*>Everyone<\/dd>/);
    });

    test('renders an eager optimized cover image tinted by level', () => {
        expect(html).toContain(`class="event-detail__cover" data-scroll style="background:${levelMeta.cover};color:${levelMeta.ink}"`);
        expect(html).toContain(coverName);
        expect(html).toMatch(/<img[^>]*data-image-component="true"[^>]*class="event-detail__cover-image">/);
        expect(html).toContain('decoding="sync"');
        expect(html).toContain('fetchpriority="high"');
        expect(html).toContain('loading="eager"');
        expect(html).toContain('sizes="(min-width: 1408px) 1152px, 100vw"');
        expect(html).toMatch(/srcset="[^"]*640w[^"]*960w[^"]*1250w"/);
    });

    test('falls back to a plain image for an unresolved cover path', () => {
        expect(unresolvedHtml).toContain(`<img class="event-detail__cover-image" alt="" decoding="async" src="${UNRESOLVED_COVER}"`);
        expect(unresolvedHtml.split('data-image-component').length - 1).toBe(0);
    });

    test('renders aria-hidden initials only when the event has no cover', () => {
        expect(fallbackHtml).toMatch(new RegExp(`<span class="event-detail__cover-initials" aria-hidden="true"[^>]*>${getInitials(event.title)}</span>`));
        expect(fallbackHtml.split('event-detail__cover-image').length - 1).toBe(0);
        expect(html.split('event-detail__cover-initials').length - 1).toBe(0);
    });

    test('transforms markdown headings, list runs, and paragraphs into content blocks', () => {
        expect(fallbackHtml).toMatch(/<div class="event-detail__content prose" data-scroll[^>]*><p[^>]*>Intro paragraph\.<\/p><h2[^>]*>Focus<\/h2><ul[^>]*><li[^>]*>Point one<\/li><li[^>]*>Point two<\/li><\/ul><p[^>]*>Closing paragraph\.<\/p><\/div>/);
        expect(fallbackHtml.split('<ul').length - 1).toBe(1);
    });

    test('transforms every line of the real event content', () => {
        expect(html.split('<h2').length - 1).toBe(headingLines.length);
        expect(html.split('<li').length - 1).toBe(listLines.length);
        expect(html.split('<p ').length - 1).toBe(paragraphLines.length);
    });

    test('links the register cta to the prefilled contact form', () => {
        expect(html).toContain(`class="button event-detail__action" href="/?event=${encodeURIComponent(event.title)}#contact"`);
        expect(html).toMatch(/data-i18n="Register"[^>]*>Register</);
    });

    test('links back to all events from the actions row', () => {
        expect(html).toContain('class="button button--outline event-detail__action" href="/events"');
        expect(html).toMatch(/data-i18n="Back to all"[^>]*>Back to all</);
    });

    test('marks each content block for scroll animation', () => {
        expect(html.split('data-scroll').length - 1).toBe(5);
    });
});
