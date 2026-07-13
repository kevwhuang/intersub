import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

const CONTENT_DIR = fileURLToPath(new URL('../../src/content', import.meta.url));
const PAGE_PATHS = ['/', '/events', '/events/2026-06-15', '/admin'] as const;

const eventIds = listIds('events').sort((idA, idB) => idB.localeCompare(idA));
const outcomeIds = listIds('outcomes').sort((idA, idB) => Number(idA) - Number(idB));
const testimonialIds = listIds('testimonials').sort();

function listIds(collection: string) {
    return readdirSync(join(CONTENT_DIR, collection))
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace(/\.json$/, ''));
}

test.describe('pages', () => {
    test('serves the core pages as html', async ({ request }) => {
        for (const path of PAGE_PATHS) {
            const response = await request.get(path);

            expect(response.status()).toBe(200);
            expect(response.headers()['content-type']).toContain('text/html');
        }
    });

    test('returns 404 for unknown pages', async ({ request }) => {
        const response = await request.get('/this-page-does-not-exist');

        expect(response.status()).toBe(404);
        expect(response.headers()['content-type']).toContain('text/html');
    });
});

test.describe('api', () => {
    test('serves events as an uncached json array', async ({ request }) => {
        const response = await request.get('/api/events');

        expect(response.status()).toBe(200);
        expect(response.headers()['cache-control']).toBe('no-store');
        expect(response.headers()['content-type']).toContain('application/json');

        const events: Record<string, unknown>[] = await response.json();

        expect(Array.isArray(events)).toBe(true);
        expect(eventIds.length).toBeGreaterThan(0);
        expect(events.map(entry => entry.id)).toEqual(eventIds);
    });

    test('serves outcomes as an uncached json array', async ({ request }) => {
        const response = await request.get('/api/outcomes');

        expect(response.status()).toBe(200);
        expect(response.headers()['cache-control']).toBe('no-store');
        expect(response.headers()['content-type']).toContain('application/json');

        const outcomes: Record<string, unknown>[] = await response.json();

        expect(Array.isArray(outcomes)).toBe(true);
        expect(outcomeIds.length).toBeGreaterThan(0);
        expect(outcomes.map(entry => entry.id)).toEqual(outcomeIds);
    });

    test('serves testimonials as an uncached json array', async ({ request }) => {
        const response = await request.get('/api/testimonials');

        expect(response.status()).toBe(200);
        expect(response.headers()['cache-control']).toBe('no-store');
        expect(response.headers()['content-type']).toContain('application/json');

        const testimonials: Record<string, unknown>[] = await response.json();

        expect(Array.isArray(testimonials)).toBe(true);
        expect(testimonialIds.length).toBeGreaterThan(0);
        expect(testimonials.map(entry => entry.id).sort()).toEqual(testimonialIds);
    });

    test('rejects an empty contact payload with 400', async ({ request }) => {
        const response = await request.post('/api/contact', { data: {} });

        expect(response.status()).toBe(400);
        expect(response.headers()['content-type']).toContain('application/json');

        const body: Record<string, unknown> = await response.json();

        expect(body.error).toBe('Name is required (max 100 characters)');
    });

    test('rejects a malformed events payload with 400', async ({ request }) => {
        const response = await request.post('/api/events', {
            data: 'not json',
            headers: { 'Content-Type': 'application/json' },
        });

        expect(response.status()).toBe(400);
        expect(response.headers()['content-type']).toContain('application/json');

        const body: Record<string, unknown> = await response.json();

        expect(body.error).toBe('Invalid request body');
    });
});
