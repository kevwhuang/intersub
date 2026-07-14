import { expect, test } from '@playwright/test';

import type { Page, Route } from '@playwright/test';

interface MockOptions {
    eventsStatus?: number;
    onMutation?: (route: Route) => Promise<void>;
}

interface SyntheticEvent {
    content: string;
    date: string;
    id: string;
    level: string;
    location: string;
    time: string;
    title: string;
}

const COVER_ERROR = 'Cover must be a URL or internal image path.';
const DELETE_ERROR = 'Failed to delete';
const DUPLICATE_DATE_ERROR = 'An event already exists on this date';
const INVALID_COVER = 'not-a-cover';
const LOAD_ERROR = 'Failed to load data';
const OFFLINE_ERROR = 'You appear to be offline. Please try again.';
const RENAMED_TITLE = 'Alpha Negotiation Lab (Edited)';
const SAVE_ERROR = 'Failed to save';
const VALID_COVER = '/images/events/x.webp';

const SYNTHETIC_EVENTS: SyntheticEvent[] = [
    {
        content: 'Synthetic Shanghai session for dashboard error testing.',
        date: '2030-03-05',
        id: '2030-03-05',
        level: 'Advanced',
        location: 'Shanghai',
        time: '19:00-21:00',
        title: 'Alpha Negotiation Lab',
    },
    {
        content: 'Synthetic Suzhou session for dashboard error testing.',
        date: '2030-04-12',
        id: '2030-04-12',
        level: 'Beginner',
        location: 'Suzhou',
        time: '10:00-12:00',
        title: 'Beta Presentation Studio',
    },
];

const [shanghaiEvent, suzhouEvent] = SYNTHETIC_EVENTS;

function getEventsTable(page: Page) {
    return page.getByRole('table', { name: 'Events' });
}

async function mockDashboardApi(page: Page, options: MockOptions = {}) {
    const mutations: string[] = [];

    await page.route('**/api/**', async (route) => {
        const request = route.request();

        const method = request.method();
        const { pathname } = new URL(request.url());

        if (method === 'GET') {
            if (options.eventsStatus && pathname === '/api/events') {
                await route.fulfill({ json: { error: 'Synthetic load failure' }, status: options.eventsStatus });

                return;
            }

            await route.fulfill({ json: pathname === '/api/events' ? SYNTHETIC_EVENTS : [] });

            return;
        }

        mutations.push(`${method} ${pathname}`);

        if (options.onMutation) {
            await options.onMutation(route);

            return;
        }

        await route.abort();
    });

    return mutations;
}

async function openDashboard(page: Page) {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
}

async function openFirstEventEdit(page: Page) {
    await getEventsTable(page).getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('load failure', () => {
    test('a failed events request shows the load error toast and an empty panel', async ({ page }) => {
        const mutations = await mockDashboardApi(page, { eventsStatus: 500 });

        await openDashboard(page);

        await expect(page.getByRole('status')).toHaveText(LOAD_ERROR);
        await expect(page.getByText('0 events')).toBeVisible();
        await expect(page.getByText('No events found')).toBeVisible();
        expect(mutations).toEqual([]);
    });
});

test.describe('save failures', () => {
    test('a 500 response shows the save error toast and keeps the form open with edited values', async ({ page }) => {
        const mutations = await mockDashboardApi(page, { onMutation: route => route.fulfill({ json: {}, status: 500 }) });

        await openDashboard(page);
        await openFirstEventEdit(page);

        await page.getByLabel('Title').fill(RENAMED_TITLE);
        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('status')).toHaveText(SAVE_ERROR);
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        await expect(page.getByLabel('Title')).toHaveValue(RENAMED_TITLE);
        await expect(page.getByLabel('Date')).toHaveValue(shanghaiEvent.date);
        await expect(page.getByLabel('Time')).toHaveValue(shanghaiEvent.time);
        await expect(page.getByLabel('Location')).toHaveValue(shanghaiEvent.location);
        await expect(page.getByLabel('Content')).toHaveValue(shanghaiEvent.content);
        expect(mutations).toEqual(['POST /api/events']);
    });

    test('a 409 response surfaces the duplicate-date error from the API', async ({ page }) => {
        const mutations = await mockDashboardApi(page, { onMutation: route => route.fulfill({ json: { error: DUPLICATE_DATE_ERROR }, status: 409 }) });

        await openDashboard(page);
        await openFirstEventEdit(page);

        await page.getByLabel('Date').fill(suzhouEvent.date);
        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('status')).toHaveText(DUPLICATE_DATE_ERROR);
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        await expect(page.getByLabel('Date')).toHaveValue(suzhouEvent.date);
        expect(mutations).toEqual(['POST /api/events']);
    });
});

test.describe('cover validation', () => {
    test('an invalid cover shows the inline error without a request and a valid path resubmits', async ({ page }) => {
        const mutations = await mockDashboardApi(page);

        await openDashboard(page);
        await openFirstEventEdit(page);

        await page.getByLabel('Cover').fill(INVALID_COVER);
        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByText(COVER_ERROR)).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        expect(mutations).toEqual([]);

        await page.getByLabel('Cover').fill(VALID_COVER);
        await expect(page.getByText(COVER_ERROR)).toBeHidden();

        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('status')).toHaveText(SAVE_ERROR);
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        await expect(page.getByLabel('Cover')).toHaveValue(VALID_COVER);
        expect(mutations).toEqual(['POST /api/events']);
    });
});

test.describe('offline save', () => {
    test('saving while offline shows the offline error toast and keeps the form open', async ({ context, page }) => {
        const mutations = await mockDashboardApi(page);

        await openDashboard(page);
        await openFirstEventEdit(page);

        await context.setOffline(true);
        await page.waitForFunction(() => navigator.onLine === false);

        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('status')).toHaveText(OFFLINE_ERROR);
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        await expect(page.getByLabel('Title')).toHaveValue(shanghaiEvent.title);
        expect(mutations).toEqual(['POST /api/events']);

        await context.setOffline(false);
        await page.waitForFunction(() => navigator.onLine === true);
    });
});

test.describe('delete failure', () => {
    test('a 500 response shows the delete error toast and keeps the dialog and row', async ({ page }) => {
        const mutations = await mockDashboardApi(page, { onMutation: route => route.fulfill({ json: {}, status: 500 }) });

        await openDashboard(page);
        await getEventsTable(page).getByRole('row').nth(1).getByRole('button', { name: 'Delete' }).click();

        const dialog = page.getByRole('dialog', { name: 'Delete this item?' });

        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Delete' }).click();

        await expect(page.getByRole('status')).toHaveText(DELETE_ERROR);
        await expect(dialog).toBeVisible();

        await dialog.getByRole('button', { name: 'Cancel' }).click();

        await expect(dialog).toBeHidden();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(SYNTHETIC_EVENTS.length + 1);
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(shanghaiEvent.title);
        expect(mutations).toEqual(['DELETE /api/events']);
    });
});

test.describe('synthetic filters', () => {
    test('location chips render both locations and filter rows to the selected one', async ({ page }) => {
        const mutations = await mockDashboardApi(page);

        await openDashboard(page);

        await expect(page.getByText('2 locations', { exact: true })).toBeVisible();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(SYNTHETIC_EVENTS.length + 1);

        await page.getByRole('button', { name: suzhouEvent.location }).click();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(2);
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(suzhouEvent.title);
        await expect(page.getByText(shanghaiEvent.title)).toHaveCount(0);

        await page.getByRole('button', { name: shanghaiEvent.location }).click();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(2);
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(shanghaiEvent.title);
        await expect(page.getByText(suzhouEvent.title)).toHaveCount(0);

        await page.getByRole('button', { name: 'Everywhere' }).click();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(SYNTHETIC_EVENTS.length + 1);
        expect(mutations).toEqual([]);
    });

    test('level chips filter rows and an unused level shows the empty state', async ({ page }) => {
        const mutations = await mockDashboardApi(page);

        await openDashboard(page);

        await page.getByRole('button', { name: shanghaiEvent.level }).click();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(2);
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(shanghaiEvent.title);

        await page.getByRole('button', { name: suzhouEvent.level }).click();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(2);
        await expect(getEventsTable(page).getByRole('row').nth(1).getByRole('cell').first()).toHaveText(suzhouEvent.title);

        await page.getByRole('button', { name: 'Intermediate' }).click();
        await expect(page.getByText('No events found')).toBeVisible();
        await expect(page.getByText('Try a different search or filter, or add a new event.')).toBeVisible();

        await page.getByRole('button', { name: 'Everyone' }).click();
        await expect(getEventsTable(page).getByRole('row')).toHaveCount(SYNTHETIC_EVENTS.length + 1);
        expect(mutations).toEqual([]);
    });
});

test.describe('stale fetch race', () => {
    test('discards a stale refetch that resolves after a newer one', async ({ page }) => {
        const freshEvent = { ...shanghaiEvent, title: 'Fresh Refetch Title' };
        const staleEvent = { ...shanghaiEvent, title: 'Stale Refetch Title' };

        let eventsCalls = 0;
        let releaseStale = () => {};
        let staleServed = false;

        const staleGate = new Promise<void>((resolve) => {
            releaseStale = resolve;
        });

        await page.route('**/api/**', async (route) => {
            const request = route.request();

            const method = request.method();
            const { pathname } = new URL(request.url());

            if (method !== 'GET') {
                await route.fulfill({ json: {} });

                return;
            }

            if (pathname !== '/api/events') {
                await route.fulfill({ json: [] });

                return;
            }

            eventsCalls += 1;

            if (eventsCalls === 1) {
                await route.fulfill({ json: SYNTHETIC_EVENTS });

                return;
            }

            if (eventsCalls === 2) {
                await staleGate;
                await route.fulfill({ json: [staleEvent] });
                staleServed = true;

                return;
            }

            await route.fulfill({ json: [freshEvent] });
        });

        await page.goto('/admin');
        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();

        await openFirstEventEdit(page);
        await page.getByRole('button', { name: 'Save changes' }).click();
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeHidden();

        await openFirstEventEdit(page);
        await page.getByRole('button', { name: 'Save changes' }).click();
        await expect(getEventsTable(page).getByText('Fresh Refetch Title')).toBeVisible();

        releaseStale();

        await expect.poll(() => staleServed).toBe(true);
        await expect(getEventsTable(page).getByText('Fresh Refetch Title')).toBeVisible();
        await expect(getEventsTable(page).getByText('Stale Refetch Title')).toHaveCount(0);
        expect(eventsCalls).toBe(3);
    });
});
