import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import { getToday } from '../../src/lib/utils';

import type { Page } from '@playwright/test';

interface EventEntry {
    date: string;
    level?: string;
    location: string;
    time: string;
    title: string;
}

const EVENTS_DIR = fileURLToPath(new URL('../../src/content/events', import.meta.url));

const events = readdirSync(EVENTS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(join(EVENTS_DIR, file), 'utf-8')) as EventEntry)
    .sort((entryA, entryB) => entryB.date.localeCompare(entryA.date));

const today = getToday();

const leveledEvents = events.filter(event => event.level);
const pastEvents = events.filter(event => event.date < today);
const upcomingEvents = events.filter(event => event.date >= today);

async function expectVisibleCards(page: Page, expected: EventEntry[]) {
    await expect(page.locator('[data-card]:visible')).toHaveCount(expected.length);
    await expect(page.locator('[data-count]')).toHaveText(`${expected.length} ${expected.length === 1 ? 'event' : 'events'}`);

    for (const event of expected) {
        await expect(page.locator(`[data-card][href="/events/${event.date}"]`)).toBeVisible();
    }
}

function getLevelFilters(page: Page) {
    return page
        .locator('[data-filter-level]:not([data-filter-level="all"])')
        .evaluateAll(buttons => buttons.map(button => String(button.getAttribute('data-filter-level'))));
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('events catalog', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/events');
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);
    });

    test('shows every event newest first with an accurate count', async ({ page }) => {
        await expect(page.locator('[data-card]')).toHaveCount(events.length);
        await expectVisibleCards(page, events);

        const hrefs = await page
            .locator('[data-card]')
            .evaluateAll(cards => cards.map(card => card.getAttribute('href')));

        expect(hrefs).toEqual(events.map(event => `/events/${event.date}`));
    });

    test('narrows the list with each level chip', async ({ page }) => {
        const levels = await getLevelFilters(page);

        expect(levels.length).toBeGreaterThan(0);

        for (const level of levels) {
            await page.locator(`[data-filter-level="${level}"]`).click();

            await expect(page.locator(`[data-filter-level="${level}"]`)).toHaveClass(/chip--active/);
            await expectVisibleCards(page, events.filter(event => event.level === level));
        }

        await page.locator('[data-filter-level="all"]').click();

        await expectVisibleCards(page, events);
    });

    test('splits upcoming and past around today in shanghai', async ({ page }) => {
        expect(upcomingEvents.length + pastEvents.length).toBe(events.length);

        await page.locator('[data-filter-timing="upcoming"]').click();

        await expectVisibleCards(page, upcomingEvents);

        await page.locator('[data-filter-timing="past"]').click();

        await expectVisibleCards(page, pastEvents);

        await page.locator('[data-filter-timing="all"]').click();

        await expectVisibleCards(page, events);
    });

    test('combines level and timing filters', async ({ page }) => {
        test.skip(leveledEvents.length === 0, 'no leveled events in content');

        const level = String(leveledEvents[0].level);

        await page.locator(`[data-filter-level="${level}"]`).click();
        await page.locator('[data-filter-timing="past"]').click();

        await expectVisibleCards(page, events.filter(event => event.level === level && event.date < today));

        await page.locator('[data-filter-timing="upcoming"]').click();

        await expectVisibleCards(page, events.filter(event => event.level === level && event.date >= today));
    });

    test('shows the empty state when no events match and clears it', async ({ page }) => {
        const levels = await getLevelFilters(page);

        const emptyLevel = levels.find(level => events.every(event => event.level !== level));

        test.skip(!emptyLevel, 'every level has events in content');

        await page.locator(`[data-filter-level="${emptyLevel}"]`).click();

        await expect(page.locator('[data-empty]')).toBeVisible();
        await expect(page.locator('.events__empty-title')).toHaveText('No events match those filters');
        await expect(page.locator('[data-grid]')).toBeHidden();
        await expect(page.locator('[data-count]')).toHaveText('0 events');

        await page.locator('[data-clear-filters]').click();

        await expect(page.locator('[data-empty]')).toBeHidden();
        await expectVisibleCards(page, events);
    });

    test('opens the event detail page from a card', async ({ page }) => {
        const [newest] = events;

        await page.locator(`[data-card][href="/events/${newest.date}"]`).click();

        await expect(page).toHaveURL(`/events/${newest.date}`);
        await expect(page.locator('.event-detail__title')).toHaveText(newest.title);
    });
});
