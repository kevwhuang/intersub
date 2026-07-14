import { basename } from 'node:path';
import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

import type { Page } from '@playwright/test';

interface EventEntry {
    content: string;
    cover?: string;
    date: string;
    level?: string;
    location: string;
    time: string;
    title: string;
}

interface OutcomeEntry {
    points: string[];
    title: string;
}

interface TestimonialEntry {
    name: string;
    role: string;
}

const MOBILE_VIEWPORTS = [
    { height: 667, width: 375 },
    { height: 900, width: 800 },
] as const;

const RELOAD_POLL = 100;
const RELOAD_QUIET = 1_500;
const RELOAD_TIMEOUT = 8_000;

const events = loadCollection<EventEntry>('src/content/events').sort((entryA, entryB) => compareText(entryA.title, entryB.title));
const firstEvent = events[0];
const lastEvent = events[events.length - 1];
const locations = [...new Set(events.map(event => event.location))].sort();
const outcomes = loadCollection<OutcomeEntry>('src/content/outcomes').sort((entryA, entryB) => compareText(entryA.title, entryB.title));
const testimonials = loadCollection<TestimonialEntry>('src/content/testimonials').sort((entryA, entryB) => compareText(entryA.name, entryB.name));

function compareText(valueA: string, valueB: string) {
    const lowerA = valueA.toLowerCase();
    const lowerB = valueB.toLowerCase();

    if (lowerA < lowerB) return -1;
    if (lowerA > lowerB) return 1;

    return 0;
}

async function expectEventRowCount(page: Page, count: number) {
    if (count === 0) {
        await expect(page.getByText('No events found')).toBeVisible();

        return;
    }

    await expect(getEventsTable(page).getByRole('row')).toHaveCount(count + 1);
}

function formatDate(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getEventsTable(page: Page) {
    return page.getByRole('table', { name: 'Events' });
}

function getToday() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

function loadCollection<T>(directory: string) {
    return execSync(`git ls-files ${directory}`, { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .filter(file => file.endsWith('.json'))
        .map(file => ({ ...JSON.parse(readFileSync(file, 'utf-8')), id: basename(file, '.json') }) as T);
}

async function openFirstEventEdit(page: Page) {
    await getEventsTable(page).getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
}

function pluralize(count: number, noun: string) {
    return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

async function settleAfterWrite(page: Page) {
    const deadline = Date.now() + RELOAD_TIMEOUT;

    let lastLoad = Date.now();

    function handleLoad() {
        lastLoad = Date.now();
    }

    page.on('load', handleLoad);

    while (Date.now() < deadline && Date.now() - lastLoad < RELOAD_QUIET) await page.waitForTimeout(RELOAD_POLL);

    page.off('load', handleLoad);
}

function trackApiWrites(page: Page) {
    const writes: string[] = [];

    page.on('request', (apiRequest) => {
        if (apiRequest.method() !== 'GET' && apiRequest.url().includes('/api/')) writes.push(apiRequest.url());
    });

    return writes;
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('dashboard shell', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
    });

    test('renders topbar, sidebar, and events panel by default', async ({ page }) => {
        await expect(page).toHaveTitle('Admin \u2014 InterSub');
        await expect(page.getByLabel('Search')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Toggle navigation' })).toBeVisible();

        const sidebar = page.getByRole('complementary', { name: 'Admin sidebar' });

        await expect(sidebar).toBeVisible();
        await expect(sidebar.getByRole('button', { name: 'Events' })).toHaveAttribute('aria-current', 'page');
        await expect(sidebar.getByRole('button', { name: 'Outcomes' })).toBeVisible();
        await expect(sidebar.getByRole('button', { name: 'Testimonials' })).toBeVisible();
        await expect(sidebar.getByText('DE', { exact: true })).toBeVisible();
        await expect(sidebar.getByRole('button', { name: 'Sign out' })).toBeVisible();
        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByText(pluralize(events.length, 'event'))).toBeVisible();
        await expect(page.getByText(pluralize(locations.length, 'location'), { exact: true })).toBeVisible();
    });

    test('persists the active panel across reload', async ({ page }) => {
        await page.getByRole('button', { name: 'Outcomes' }).click();
        await expect(page.getByRole('heading', { level: 1, name: 'Outcomes' })).toBeVisible();

        const stored = await page.evaluate(() => localStorage.getItem('intersub_panel'));

        expect(stored).toBe('outcomes');

        await page.reload();
        await expect(page.getByRole('heading', { level: 1, name: 'Outcomes' })).toBeVisible();
    });

    test('switches panels to outcomes and testimonials tables', async ({ page }) => {
        await page.getByRole('button', { name: 'Outcomes' }).click();
        await expect(page.getByText(pluralize(outcomes.length, 'outcome'))).toBeVisible();

        const outcomesTable = page.getByRole('table', { name: 'Outcomes' });

        await expect(outcomesTable.getByRole('row')).toHaveCount(outcomes.length + 1);
        await expect(outcomesTable.getByRole('row').nth(1).getByRole('cell').first()).toHaveText(outcomes[0].title);
        await expect(outcomesTable.getByRole('row').nth(1).getByRole('cell').nth(2)).toHaveText(String(outcomes[0].points.length));

        await page.getByRole('button', { name: 'Testimonials' }).click();
        await expect(page.getByText(pluralize(testimonials.length, 'testimonial'))).toBeVisible();

        const testimonialsTable = page.getByRole('table', { name: 'Testimonials' });

        await expect(testimonialsTable.getByRole('row')).toHaveCount(testimonials.length + 1);
        await expect(testimonialsTable.getByRole('row').nth(1).getByRole('cell').first()).toHaveText(testimonials[0].name);
        await expect(testimonialsTable.getByRole('row').nth(1).getByRole('cell').nth(1)).toHaveText(testimonials[0].role);

        await testimonialsTable.getByRole('button', { name: 'Name' }).click();
        await expect(testimonialsTable.getByRole('row').nth(1).getByRole('cell').first()).toHaveText(testimonials[testimonials.length - 1].name);
    });
});

test.describe('events table', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
    });

    test('shows real content values in title, date, time, location, and level columns', async ({ page }) => {
        const table = getEventsTable(page);

        await expect(table.getByRole('row')).toHaveCount(events.length + 1);
        await expect(table.getByRole('columnheader')).toHaveText(['Title \u2191', 'Date', 'Time', 'Location', 'Who', 'Actions']);

        expect(formatDate('2026-06-15')).toBe('Jun 15, 2026');

        const cells = table.getByRole('row').nth(1).getByRole('cell');

        await expect(cells.nth(0)).toHaveText(firstEvent.title);
        await expect(cells.nth(1)).toHaveText(formatDate(firstEvent.date));
        await expect(cells.nth(2)).toHaveText(firstEvent.time);
        await expect(cells.nth(3)).toHaveText(firstEvent.location);
        await expect(cells.nth(4)).toHaveText(firstEvent.level ?? '');
    });

    test('sort button toggles order and swaps the first row', async ({ page }) => {
        const table = getEventsTable(page);

        await expect(table.getByRole('columnheader').first()).toHaveAttribute('aria-sort', 'ascending');

        await table.getByRole('button', { name: 'Title' }).click();
        await expect(table.getByRole('columnheader').first()).toHaveAttribute('aria-sort', 'descending');
        await expect(table.getByRole('row').nth(1).getByRole('cell').first()).toHaveText(lastEvent.title);

        await table.getByRole('button', { name: 'Title' }).click();
        await expect(table.getByRole('columnheader').first()).toHaveAttribute('aria-sort', 'ascending');
        await expect(table.getByRole('row').nth(1).getByRole('cell').first()).toHaveText(firstEvent.title);
    });

    test('level chips filter rows and show the empty state when nothing matches', async ({ page }) => {
        const advancedEvents = events.filter(event => event.level === 'Advanced');

        await page.getByRole('button', { name: 'Advanced' }).click();
        await expectEventRowCount(page, advancedEvents.length);
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(advancedEvents[0].title);

        const unusedLevel = ['Beginner', 'Intermediate', 'Advanced', 'Cohort'].find(level => events.every(event => event.level !== level));

        if (!unusedLevel) throw new Error('expected a level with no matching events for the empty-state assertion');

        await page.getByRole('button', { name: unusedLevel }).click();
        await expect(page.getByText('No events found')).toBeVisible();
        await expect(page.getByText('Try a different search or filter, or add a new event.')).toBeVisible();

        await page.getByRole('button', { name: 'Everyone' }).click();
        await expectEventRowCount(page, events.length);
    });

    test('timing chips filter rows by date against today', async ({ page }) => {
        const currentDay = getToday();
        const pastCount = events.filter(event => event.date < currentDay).length;

        await page.getByRole('button', { name: 'Past' }).click();
        await expectEventRowCount(page, pastCount);

        await page.getByRole('button', { name: 'Upcoming' }).click();
        await expectEventRowCount(page, events.length - pastCount);

        await page.getByRole('button', { name: 'All', exact: true }).click();
        await expectEventRowCount(page, events.length);
    });

    test('search filters rows and shows the empty state when nothing matches', async ({ page }) => {
        const loweredTitle = lastEvent.title.toLowerCase();
        const matching = events.filter(event => event.location.toLowerCase().includes(loweredTitle) || event.title.toLowerCase().includes(loweredTitle));

        await page.getByLabel('Search').fill('zzzz');
        await expect(page.getByText('No events found')).toBeVisible();

        await page.getByLabel('Search').fill(loweredTitle);
        await expectEventRowCount(page, matching.length);
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(matching[0].title);

        await page.getByLabel('Search').fill('');
        await expectEventRowCount(page, events.length);
    });
});

test.describe('edit form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
    });

    test('opens populated with the row values from real content', async ({ page }) => {
        await openFirstEventEdit(page);

        await expect(page.getByLabel('Title')).toHaveValue(firstEvent.title);
        await expect(page.getByLabel('Date')).toHaveValue(firstEvent.date);
        await expect(page.getByLabel('Time')).toHaveValue(firstEvent.time);
        await expect(page.getByLabel('Location')).toHaveValue(firstEvent.location);
        await expect(page.getByRole('combobox')).toHaveValue(firstEvent.level ?? '');
        await expect(page.getByLabel('Cover')).toHaveValue(firstEvent.cover ?? '');
        await expect(page.getByLabel('Content')).toHaveValue(firstEvent.content);
    });

    test('cancel closes the form without changes', async ({ page }) => {
        await openFirstEventEdit(page);
        await page.getByRole('button', { name: 'Cancel' }).click();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(firstEvent.title);
    });

    test('save with a cleared required field shows an inline error and does not close or write', async ({ page }) => {
        const writes = trackApiWrites(page);

        await openFirstEventEdit(page);
        await page.getByLabel('Title').fill('');
        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByText('Title is required.')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        expect(writes).toEqual([]);

        await page.getByRole('button', { name: 'Cancel' }).click();
        await openFirstEventEdit(page);
        await expect(page.getByLabel('Title')).toHaveValue(firstEvent.title);
    });

    test('byte-identical save returns to the table and leaves the entry unchanged', async ({ page, request }) => {
        const before: unknown = await (await request.get('/api/events')).json();

        await openFirstEventEdit(page);
        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(firstEvent.title);
        await settleAfterWrite(page);

        const after: unknown = await (await request.get('/api/events')).json();

        expect(after).toEqual(before);
    });
});

test.describe('delete modal', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
    });

    test('opens an accessible dialog and traps focus', async ({ page }) => {
        const writes = trackApiWrites(page);

        await getEventsTable(page).getByRole('row').nth(1).getByRole('button', { name: 'Delete' }).click();

        const dialog = page.getByRole('dialog', { name: 'Delete this item?' });

        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(dialog.getByRole('heading', { name: 'Delete this item?' })).toBeVisible();
        await expect(dialog.getByText(firstEvent.title)).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(dialog.getByRole('button', { name: 'Delete' })).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();

        await page.keyboard.press('Shift+Tab');
        await expect(dialog.getByRole('button', { name: 'Delete' })).toBeFocused();

        expect(writes).toEqual([]);
    });

    test('escape closes the dialog and restores focus', async ({ page }) => {
        const writes = trackApiWrites(page);
        const deleteButton = getEventsTable(page).getByRole('row').nth(1).getByRole('button', { name: 'Delete' });

        await deleteButton.click();
        await expect(page.getByRole('dialog', { name: 'Delete this item?' })).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog', { name: 'Delete this item?' })).toBeHidden();
        await expect(deleteButton).toBeFocused();
        expect(writes).toEqual([]);
    });

    test('cancel closes the dialog and restores focus', async ({ page }) => {
        const writes = trackApiWrites(page);
        const deleteButton = getEventsTable(page).getByRole('row').nth(1).getByRole('button', { name: 'Delete' });

        await deleteButton.click();

        const dialog = page.getByRole('dialog', { name: 'Delete this item?' });

        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(dialog).toBeHidden();
        await expect(deleteButton).toBeFocused();
        expect(writes).toEqual([]);
    });
});

test.describe('new event form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
    });

    test('opens with empty fields and cancel returns to the table', async ({ page }) => {
        const writes = trackApiWrites(page);

        await page.getByRole('button', { name: 'New event' }).click();
        await expect(page.getByRole('heading', { name: 'New event' })).toBeVisible();

        await expect(page.getByLabel('Title')).toHaveValue('');
        await expect(page.getByLabel('Date')).toHaveValue('');
        await expect(page.getByLabel('Time')).toHaveValue('');
        await expect(page.getByLabel('Location')).toHaveValue('');
        await expect(page.getByRole('combobox')).toHaveValue('');
        await expect(page.getByLabel('Cover')).toHaveValue('');
        await expect(page.getByLabel('Content')).toHaveValue('');
        await expect(page.getByRole('button', { name: 'Create event' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Delete event' })).toHaveCount(0);

        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expectEventRowCount(page, events.length);
        expect(writes).toEqual([]);
    });
});

test.describe('auth', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
        await page.getByRole('button', { name: 'Sign out' }).click();
    });

    test('sign out shows the login screen', async ({ page }) => {
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Back to site' })).toBeVisible();
    });

    test('empty credentials show a validation error', async ({ page }) => {
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByRole('alert')).toHaveText('Email and password are required.');
    });

    test('any credentials sign back in on local dev', async ({ page }) => {
        await page.getByLabel('Email').fill('dev@localhost');
        await page.getByLabel('Password').fill('password');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();

        await page.getByRole('button', { name: 'Toggle navigation' }).click();
        await expect(page.getByRole('complementary', { name: 'Admin sidebar' })).toBeVisible();
    });
});

test.describe('responsive', () => {
    for (const viewport of MOBILE_VIEWPORTS) {
        test(`sidebar becomes a focus-trapping drawer at ${viewport.width}px`, async ({ page }) => {
            await page.setViewportSize({ height: viewport.height, width: viewport.width });
            await page.goto('/admin');

            const sidebar = page.getByRole('complementary', { name: 'Admin sidebar' });
            const toggle = page.getByRole('button', { name: 'Toggle navigation' });

            await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
            await expect(sidebar).toBeHidden();
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');

            await toggle.click();
            await expect(sidebar).toBeVisible();
            await expect(toggle).toHaveAttribute('aria-expanded', 'true');
            await expect(sidebar.getByRole('button', { name: 'Sign out' })).toBeVisible();
            await expect(sidebar.getByRole('link', { name: 'Back to site' })).toBeFocused();

            await page.keyboard.press('Shift+Tab');
            await expect(sidebar.getByRole('button', { name: 'Sign out' })).toBeFocused();

            await page.keyboard.press('Tab');
            await expect(sidebar.getByRole('link', { name: 'Back to site' })).toBeFocused();

            await page.keyboard.press('Escape');
            await expect(sidebar).toBeHidden();
            await expect(toggle).toBeFocused();
        });

        test(`table area scrolls inside its own container at ${viewport.width}px`, async ({ page }) => {
            await page.setViewportSize({ height: viewport.height, width: viewport.width });
            await page.goto('/admin');
            await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();

            const container = page.locator('main [style*="overflow: auto"]');

            await expect(container).toBeVisible();

            const overflowX = await container.evaluate(element => getComputedStyle(element).overflowX);

            expect(overflowX).toBe('auto');

            const hasPageOverflow = await page.evaluate(
                () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
            );

            expect(hasPageOverflow).toBe(false);
        });
    }
});
