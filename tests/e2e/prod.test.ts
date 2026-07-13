import { expect, test } from '@playwright/test';

import type { APIRequestContext, APIResponse } from '@playwright/test';

const BASE_URL = 'https://intersubstudio.com';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_FIELDS = ['content', 'date', 'id', 'location', 'time', 'title'] as const;
const EVENT_SLUG = '2026-06-15';
const EVENT_TITLE = 'Better Face Inside Your Face';
const OUTCOME_FIELDS = ['id', 'summary', 'title'] as const;
const TESTIMONIAL_FIELDS = ['id', 'industry', 'name', 'quote', 'role'] as const;
const TIME_PATTERN = /^\d{2}:\d{2}\u2013\d{2}:\d{2}$/;

function expectNonEmptyString(value: unknown) {
    expect(typeof value).toBe('string');
    expect(value).not.toBe('');
}

async function expectUnauthorized(response: APIResponse) {
    expect(response.status()).toBe(401);
    expect(response.headers()['content-type']).toContain('application/json');

    const body: Record<string, unknown> = await response.json();

    expect(body.error).toBe('Unauthorized');
}

async function fetchHtml(api: APIRequestContext, path: string) {
    const response = await api.get(`${BASE_URL}${path}`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');

    return response.text();
}

async function fetchJsonArray(api: APIRequestContext, path: string) {
    const response = await api.get(`${BASE_URL}${path}`);

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['content-type']).toContain('application/json');

    const entries: Record<string, unknown>[] = await response.json();

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    return entries;
}

test.describe.configure({ timeout: 60_000 });

test.describe('production pages', () => {
    test('serves the home page with the intersub title', async ({ request }) => {
        const html = await fetchHtml(request, '/');

        expect(html).toContain('<title>InterSub</title>');
    });

    test('serves the events catalog page with the events grid', async ({ request }) => {
        const html = await fetchHtml(request, '/events');

        expect(html).toContain('Events \u2014 InterSub</title>');
        expect(html).toContain('events__grid');
        expect(html).toContain('data-card');
    });

    test('serves the event detail page with its title', async ({ request }) => {
        const html = await fetchHtml(request, `/events/${EVENT_SLUG}`);

        expect(html).toContain(`<title>${EVENT_TITLE} \u2014 InterSub</title>`);
        expect(html).toContain(EVENT_TITLE);
    });

    test('serves the admin page', async ({ request }) => {
        const html = await fetchHtml(request, '/admin');

        expect(html).toContain('<title>Admin \u2014 InterSub</title>');
    });

    test('returns 404 for an unknown page', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/this-page-does-not-exist`);

        expect(response.status()).toBe(404);
        expect(response.headers()['content-type']).toContain('text/html');
    });

    test('renders the home page in a real browser', async ({ page }) => {
        const response = await page.goto(`${BASE_URL}/`);

        expect(response?.status()).toBe(200);

        await expect(page).toHaveTitle('InterSub');
    });

    test('renders the event detail title in a real browser', async ({ page }) => {
        const response = await page.goto(`${BASE_URL}/events/${EVENT_SLUG}`);

        expect(response?.status()).toBe(200);

        await expect(page.locator('.event-detail__title')).toHaveText(EVENT_TITLE);
    });
});

test.describe('production api', () => {
    test('serves events as an uncached json array sorted date-descending', async ({ request }) => {
        const events = await fetchJsonArray(request, '/api/events');

        for (const entry of events) {
            for (const field of EVENT_FIELDS) expectNonEmptyString(entry[field]);

            expect(String(entry.date)).toMatch(DATE_PATTERN);
            expect(String(entry.time)).toMatch(TIME_PATTERN);

            if (entry.cover !== undefined) expectNonEmptyString(entry.cover);
            if (entry.level !== undefined) expectNonEmptyString(entry.level);
        }

        const dates = events.map(entry => String(entry.date));

        expect(dates).toEqual([...dates].sort().reverse());
    });

    test('serves outcomes as an uncached json array of shaped entries', async ({ request }) => {
        const outcomes = await fetchJsonArray(request, '/api/outcomes');

        for (const entry of outcomes) {
            for (const field of OUTCOME_FIELDS) expectNonEmptyString(entry[field]);

            const points = entry.points as unknown[];

            expect(Array.isArray(points)).toBe(true);
            expect(points.length).toBeGreaterThan(0);

            for (const point of points) expectNonEmptyString(point);
        }
    });

    test('serves testimonials as an uncached json array of shaped entries', async ({ request }) => {
        const testimonials = await fetchJsonArray(request, '/api/testimonials');

        for (const entry of testimonials) {
            for (const field of TESTIMONIAL_FIELDS) expectNonEmptyString(entry[field]);
        }
    });
});

test.describe('production auth', () => {
    test('rejects an events post without authorization', async ({ request }) => {
        await expectUnauthorized(await request.post(`${BASE_URL}/api/events`, { data: {} }));
    });

    test('rejects an events post with a garbage bearer token', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/api/events`, {
            data: {},
            headers: { Authorization: 'Bearer not-a-real-token' },
        });

        await expectUnauthorized(response);
    });

    test('rejects an events delete without authorization', async ({ request }) => {
        await expectUnauthorized(await request.delete(`${BASE_URL}/api/events`, { data: { id: 'nope' } }));
    });

    test('rejects an outcomes post without authorization', async ({ request }) => {
        await expectUnauthorized(await request.post(`${BASE_URL}/api/outcomes`, { data: {} }));
    });

    test('rejects an outcomes delete without authorization', async ({ request }) => {
        await expectUnauthorized(await request.delete(`${BASE_URL}/api/outcomes`, { data: { id: 'nope' } }));
    });

    test('rejects a testimonials post without authorization', async ({ request }) => {
        await expectUnauthorized(await request.post(`${BASE_URL}/api/testimonials`, { data: {} }));
    });

    test('rejects a testimonials delete without authorization', async ({ request }) => {
        await expectUnauthorized(await request.delete(`${BASE_URL}/api/testimonials`, { data: { id: 'nope' } }));
    });
});
