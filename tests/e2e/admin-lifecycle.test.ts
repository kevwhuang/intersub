import { basename, join } from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

import type { APIRequestContext, Page } from '@playwright/test';

const OUTCOME_SENTINEL = {
    points: ['Sentinel point alpha', 'Sentinel point beta', 'Sentinel point gamma'],
    summary: 'Sentinel outcome summary entered through the panel.',
    title: 'Sentinel Lifecycle Outcome',
} as const;

const OUTCOME_UPDATED_SUMMARY = 'Sentinel outcome summary after editing.';
const RELOAD_POLL = 100;
const RELOAD_QUIET = 1_500;
const RELOAD_TIMEOUT = 8_000;

const SENTINEL = {
    content: 'Sentinel lifecycle content for dashboard testing.',
    date: '1991-01-01',
    dateLabel: 'Jan 1, 1991',
    level: 'Beginner',
    location: 'Sentinel City',
    time: '09:00-11:00',
    timeLabel: '09:00\u201311:00',
    title: 'Sentinel Lifecycle Event',
} as const;

const SENTINEL_ID = SENTINEL.date;

const TESTIMONIAL_SENTINEL = {
    industry: 'Quality Assurance',
    name: 'UI Sentinel',
    quote: 'Sentinel testimonial quote entered through the panel.',
    role: 'QA Robot',
} as const;

const TESTIMONIAL_SENTINEL_ID = 'ui-sentinel-qa-robot';
const TESTIMONIAL_UPDATED_QUOTE = 'Sentinel testimonial quote after editing.';
const UPDATED_TITLE = 'Sentinel Renamed Session';

const committedEventIds = listCommittedIds('src/content/events');
const committedOutcomeIds = listCommittedIds('src/content/outcomes');
const committedSnapshots = new Map<string, string>();
const committedTestimonialIds = listCommittedIds('src/content/testimonials');
const eventsDir = fileURLToPath(new URL('../../src/content/events', import.meta.url));
const outcomesDir = fileURLToPath(new URL('../../src/content/outcomes', import.meta.url));

const sentinelPath = join(eventsDir, `${SENTINEL_ID}.json`);
const testimonialsDir = fileURLToPath(new URL('../../src/content/testimonials', import.meta.url));

function expectCommittedIntact(directory: string, ids: string[]) {
    for (const id of ids) {
        const filepath = join(directory, `${id}.json`);

        expect(readFileSync(filepath).toString('base64')).toBe(committedSnapshots.get(filepath));
    }
}

function getPanelRow(page: Page, panel: string, text: string) {
    return page.getByRole('table', { name: panel }).getByRole('row').filter({ hasText: text });
}

function listCommittedIds(directory: string) {
    return execSync(`git ls-files ${directory}`, { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .filter(file => file.endsWith('.json'))
        .map(file => basename(file, '.json'));
}

async function removeSentinel(request: APIRequestContext) {
    const response = await request.delete('/api/events', { data: { id: SENTINEL_ID } });

    expect([200, 404]).toContain(response.status());
}

async function removeTestimonialSentinel(request: APIRequestContext) {
    const response = await request.delete('/api/testimonials', { data: { id: TESTIMONIAL_SENTINEL_ID } });

    expect([200, 404]).toContain(response.status());
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

function snapshotCommitted(directory: string, ids: string[]) {
    for (const id of ids) {
        const filepath = join(directory, `${id}.json`);

        committedSnapshots.set(filepath, readFileSync(filepath).toString('base64'));
    }
}

function sweepCollection(directory: string, ids: string[]) {
    for (const file of readdirSync(directory)) {
        if (!file.endsWith('.json') || ids.includes(basename(file, '.json'))) continue;

        rmSync(join(directory, file), { force: true });
    }
}

test.beforeAll(() => {
    snapshotCommitted(eventsDir, committedEventIds);
    snapshotCommitted(outcomesDir, committedOutcomeIds);
    snapshotCommitted(testimonialsDir, committedTestimonialIds);
});

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.afterEach(async ({ request }) => {
    await removeSentinel(request);
    await removeTestimonialSentinel(request);
    sweepCollection(eventsDir, committedEventIds);
    sweepCollection(outcomesDir, committedOutcomeIds);
    sweepCollection(testimonialsDir, committedTestimonialIds);
});

test.afterAll(() => {
    sweepCollection(eventsDir, committedEventIds);
    sweepCollection(outcomesDir, committedOutcomeIds);
    sweepCollection(testimonialsDir, committedTestimonialIds);
});

test.describe('event lifecycle', () => {
    test('creates, edits, and deletes a sentinel event through the dashboard', async ({ page, request }) => {
        await removeSentinel(request);
        await page.goto('/admin');

        try {
            await page.getByRole('button', { name: 'New event' }).click();
            await expect(page.getByRole('heading', { name: 'New event' })).toBeVisible();

            await page.getByLabel('Title').fill(SENTINEL.title);
            await page.getByLabel('Date').fill(SENTINEL.date);
            await page.getByLabel('Time').fill(SENTINEL.time);
            await page.getByLabel('Location').fill(SENTINEL.location);
            await page.getByRole('combobox').selectOption(SENTINEL.level);
            await page.getByLabel('Content').fill(SENTINEL.content);
            await page.getByRole('button', { name: 'Create event' }).click();

            await expect(getPanelRow(page, 'Events', SENTINEL.title)).toHaveCount(1);
            await settleAfterWrite(page);

            await page.reload();
            await expect(getPanelRow(page, 'Events', SENTINEL.title)).toHaveCount(1);

            const cells = getPanelRow(page, 'Events', SENTINEL.title).getByRole('cell');

            await expect(cells.nth(0)).toHaveText(SENTINEL.title);
            await expect(cells.nth(1)).toHaveText(SENTINEL.dateLabel);
            await expect(cells.nth(2)).toHaveText(SENTINEL.timeLabel);
            await expect(cells.nth(3)).toHaveText(SENTINEL.location);
            await expect(cells.nth(4)).toHaveText(SENTINEL.level);

            const persisted: { id: string; time: string; title: string }[]
                = await (await request.get('/api/events')).json();

            const entry = persisted.find(event => event.id === SENTINEL_ID);

            expect(entry?.time).toBe(SENTINEL.timeLabel);
            expect(entry?.title).toBe(SENTINEL.title);
            expect(existsSync(sentinelPath)).toBe(true);

            await getPanelRow(page, 'Events', SENTINEL.title).getByRole('button', { name: 'Edit' }).click();
            await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
            await expect(page.getByLabel('Title')).toHaveValue(SENTINEL.title);

            await page.getByLabel('Title').fill(UPDATED_TITLE);
            await page.getByRole('button', { name: 'Save changes' }).click();

            await expect(getPanelRow(page, 'Events', UPDATED_TITLE)).toHaveCount(1);
            await expect(getPanelRow(page, 'Events', SENTINEL.title)).toHaveCount(0);
            await settleAfterWrite(page);

            await page.reload();
            await expect(getPanelRow(page, 'Events', UPDATED_TITLE)).toHaveCount(1);

            const renamed: { id: string; title: string }[] = await (await request.get('/api/events')).json();

            expect(renamed.find(event => event.id === SENTINEL_ID)?.title).toBe(UPDATED_TITLE);

            await getPanelRow(page, 'Events', UPDATED_TITLE).getByRole('button', { name: 'Delete' }).click();

            const dialog = page.getByRole('dialog', { name: 'Delete this item?' });

            await expect(dialog).toBeVisible();
            await expect(dialog.getByText(UPDATED_TITLE)).toBeVisible();
            await dialog.getByRole('button', { name: 'Delete' }).click();

            await expect(getPanelRow(page, 'Events', UPDATED_TITLE)).toHaveCount(0);
            await settleAfterWrite(page);

            await page.reload();
            await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
            await expect(getPanelRow(page, 'Events', UPDATED_TITLE)).toHaveCount(0);

            const remaining: { id: string }[] = await (await request.get('/api/events')).json();

            expect(remaining.some(event => event.id === SENTINEL_ID)).toBe(false);
            expect(existsSync(sentinelPath)).toBe(false);
        } finally {
            await removeSentinel(request);
        }
    });

    test('missing required fields show inline errors and cancel adds no row', async ({ page }) => {
        await page.goto('/admin');

        const writes: string[] = [];

        page.on('request', (apiRequest) => {
            if (apiRequest.method() !== 'GET' && apiRequest.url().includes('/api/')) writes.push(apiRequest.url());
        });

        await page.getByRole('button', { name: 'New event' }).click();
        await page.getByLabel('Title').fill(SENTINEL.title);
        await page.getByRole('button', { name: 'Create event' }).click();

        await expect(page.getByText('Date is required.')).toBeVisible();
        await expect(page.getByText('Time must be a 24-hour range.')).toBeVisible();
        await expect(page.getByText('Location is required.')).toBeVisible();
        await expect(page.getByText('Content is required.')).toBeVisible();
        await expect(page.getByText('Title is required.')).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'New event' })).toBeVisible();

        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(getPanelRow(page, 'Events', SENTINEL.title)).toHaveCount(0);
        expect(writes).toEqual([]);
    });

    test('committed events remain byte-identical and the sentinel is gone', async ({ request }) => {
        const events: { id: string }[] = await (await request.get('/api/events')).json();

        const ids = events.map(event => event.id);

        for (const id of committedEventIds) expect(ids).toContain(id);

        expect(ids).not.toContain(SENTINEL_ID);
        expect(existsSync(sentinelPath)).toBe(false);

        expectCommittedIntact(eventsDir, committedEventIds);
    });
});

test.describe('outcome lifecycle', () => {
    test('creates, edits, and deletes a sentinel outcome through the dashboard', async ({ page, request }) => {
        await page.goto('/admin');
        await page.getByRole('button', { exact: true, name: 'Outcomes' }).click();
        await expect(page.getByRole('heading', { level: 1, name: 'Outcomes' })).toBeVisible();

        try {
            await page.getByRole('button', { name: 'New outcome' }).click();
            await expect(page.getByRole('heading', { name: 'New outcome' })).toBeVisible();

            await page.getByLabel('Title').fill(OUTCOME_SENTINEL.title);
            await page.getByLabel('Summary').fill(OUTCOME_SENTINEL.summary);
            await page.getByLabel('Outcomes').fill(OUTCOME_SENTINEL.points.join('\n'));
            await page.getByRole('button', { name: 'Create outcome' }).click();

            await expect(getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title)).toHaveCount(1);
            await settleAfterWrite(page);

            await page.reload();
            await expect(getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title)).toHaveCount(1);

            const cells = getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title).getByRole('cell');

            await expect(cells.nth(0)).toHaveText(OUTCOME_SENTINEL.title);
            await expect(cells.nth(1)).toHaveText(OUTCOME_SENTINEL.summary);
            await expect(cells.nth(2)).toHaveText(String(OUTCOME_SENTINEL.points.length));

            const persisted: { id: string; points: string[]; title: string }[]
                = await (await request.get('/api/outcomes')).json();

            const created = persisted.find(outcome => outcome.title === OUTCOME_SENTINEL.title);

            expect(created).toBeDefined();

            if (!created) return;

            const outcomePath = join(outcomesDir, `${created.id}.json`);

            expect(created.points).toEqual(OUTCOME_SENTINEL.points);
            expect(existsSync(outcomePath)).toBe(true);

            await getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title).getByRole('button', { name: 'Edit' }).click();
            await expect(page.getByRole('heading', { name: 'Edit outcome' })).toBeVisible();
            await expect(page.getByLabel('Title')).toHaveValue(OUTCOME_SENTINEL.title);
            await expect(page.getByLabel('Outcomes')).toHaveValue(OUTCOME_SENTINEL.points.join('\n'));

            await page.getByLabel('Summary').fill(OUTCOME_UPDATED_SUMMARY);
            await page.getByRole('button', { name: 'Save changes' }).click();

            await expect(getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title).getByRole('cell').nth(1)).toHaveText(OUTCOME_UPDATED_SUMMARY);
            await settleAfterWrite(page);

            await page.reload();
            await expect(getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title).getByRole('cell').nth(1)).toHaveText(OUTCOME_UPDATED_SUMMARY);

            await getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title).getByRole('button', { name: 'Delete' }).click();

            const dialog = page.getByRole('dialog', { name: 'Delete this item?' });

            await expect(dialog).toBeVisible();
            await expect(dialog.getByText(OUTCOME_SENTINEL.title)).toBeVisible();
            await dialog.getByRole('button', { name: 'Delete' }).click();

            await expect(getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title)).toHaveCount(0);
            await settleAfterWrite(page);

            await page.reload();
            await expect(page.getByRole('heading', { level: 1, name: 'Outcomes' })).toBeVisible();
            await expect(getPanelRow(page, 'Outcomes', OUTCOME_SENTINEL.title)).toHaveCount(0);

            const remaining: { id: string }[] = await (await request.get('/api/outcomes')).json();

            expect(remaining.some(outcome => outcome.id === created.id)).toBe(false);
            expect(existsSync(outcomePath)).toBe(false);
        } finally {
            sweepCollection(outcomesDir, committedOutcomeIds);
        }
    });

    test('committed outcomes remain byte-identical and the sentinel is gone', async ({ request }) => {
        const outcomes: { id: string; title: string }[] = await (await request.get('/api/outcomes')).json();

        const ids = outcomes.map(outcome => outcome.id);

        for (const id of committedOutcomeIds) expect(ids).toContain(id);

        expect(outcomes.some(outcome => outcome.title === OUTCOME_SENTINEL.title)).toBe(false);

        expectCommittedIntact(outcomesDir, committedOutcomeIds);
    });
});

test.describe('testimonial lifecycle', () => {
    test('creates, edits, and deletes a sentinel testimonial through the dashboard', async ({ page, request }) => {
        await removeTestimonialSentinel(request);
        await page.goto('/admin');
        await page.getByRole('button', { exact: true, name: 'Testimonials' }).click();
        await expect(page.getByRole('heading', { level: 1, name: 'Testimonials' })).toBeVisible();

        const sentinelFile = join(testimonialsDir, `${TESTIMONIAL_SENTINEL_ID}.json`);

        try {
            await page.getByRole('button', { name: 'New testimonial' }).click();
            await expect(page.getByRole('heading', { name: 'New testimonial' })).toBeVisible();

            await page.getByLabel('Name').fill(TESTIMONIAL_SENTINEL.name);
            await page.getByLabel('Role').fill(TESTIMONIAL_SENTINEL.role);
            await page.getByLabel('Industry').fill(TESTIMONIAL_SENTINEL.industry);
            await page.getByLabel('Quote').fill(TESTIMONIAL_SENTINEL.quote);
            await page.getByRole('button', { name: 'Create testimonial' }).click();

            await expect(getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name)).toHaveCount(1);
            await settleAfterWrite(page);

            await page.reload();
            await expect(getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name)).toHaveCount(1);

            const cells = getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name).getByRole('cell');

            await expect(cells.nth(0)).toHaveText(TESTIMONIAL_SENTINEL.name);
            await expect(cells.nth(1)).toHaveText(TESTIMONIAL_SENTINEL.role);
            await expect(cells.nth(2)).toHaveText(TESTIMONIAL_SENTINEL.industry);
            await expect(cells.nth(3)).toHaveText(TESTIMONIAL_SENTINEL.quote);

            const persisted: { id: string; quote: string }[] = await (await request.get('/api/testimonials')).json();

            const entry = persisted.find(testimonial => testimonial.id === TESTIMONIAL_SENTINEL_ID);

            expect(entry?.quote).toBe(TESTIMONIAL_SENTINEL.quote);
            expect(existsSync(sentinelFile)).toBe(true);

            await getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name).getByRole('button', { name: 'Edit' }).click();
            await expect(page.getByRole('heading', { name: 'Edit testimonial' })).toBeVisible();
            await expect(page.getByLabel('Name')).toHaveValue(TESTIMONIAL_SENTINEL.name);
            await expect(page.getByLabel('Quote')).toHaveValue(TESTIMONIAL_SENTINEL.quote);

            await page.getByLabel('Quote').fill(TESTIMONIAL_UPDATED_QUOTE);
            await page.getByRole('button', { name: 'Save changes' }).click();

            await expect(getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name).getByRole('cell').nth(3)).toHaveText(TESTIMONIAL_UPDATED_QUOTE);
            await settleAfterWrite(page);

            await page.reload();
            await expect(getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name).getByRole('cell').nth(3)).toHaveText(TESTIMONIAL_UPDATED_QUOTE);

            await getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name).getByRole('button', { name: 'Delete' }).click();

            const dialog = page.getByRole('dialog', { name: 'Delete this item?' });

            await expect(dialog).toBeVisible();
            await expect(dialog.getByText(TESTIMONIAL_SENTINEL.name)).toBeVisible();
            await dialog.getByRole('button', { name: 'Delete' }).click();

            await expect(getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name)).toHaveCount(0);
            await settleAfterWrite(page);

            await page.reload();
            await expect(page.getByRole('heading', { level: 1, name: 'Testimonials' })).toBeVisible();
            await expect(getPanelRow(page, 'Testimonials', TESTIMONIAL_SENTINEL.name)).toHaveCount(0);

            const remaining: { id: string }[] = await (await request.get('/api/testimonials')).json();

            expect(remaining.some(testimonial => testimonial.id === TESTIMONIAL_SENTINEL_ID)).toBe(false);
            expect(existsSync(sentinelFile)).toBe(false);
        } finally {
            await removeTestimonialSentinel(request);
            sweepCollection(testimonialsDir, committedTestimonialIds);
        }
    });

    test('committed testimonials remain byte-identical and the sentinel is gone', async ({ request }) => {
        const testimonials: { id: string }[] = await (await request.get('/api/testimonials')).json();

        const ids = testimonials.map(testimonial => testimonial.id);

        for (const id of committedTestimonialIds) expect(ids).toContain(id);

        expect(ids).not.toContain(TESTIMONIAL_SENTINEL_ID);
        expect(existsSync(join(testimonialsDir, `${TESTIMONIAL_SENTINEL_ID}.json`))).toBe(false);

        expectCommittedIntact(testimonialsDir, committedTestimonialIds);
    });
});
