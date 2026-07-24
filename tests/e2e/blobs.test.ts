import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { getStore } from '@netlify/blobs';
import { join } from 'node:path';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const PREFIX = `vitest-${process.pid}-`;
const SITE_ID = 'ea8a2c98-379a-437b-9062-94c97995a975';
const SWEEP_PREFIX = 'vitest-';
const TEST_TIMEOUT = 30_000;

const envPath = join(process.cwd(), '.env');

const envLines = existsSync(envPath) ? readFileSync(envPath, 'utf-8').split('\n') : [];

const tokenLine = envLines.find(line => line.startsWith('NETLIFY_AUTH_TOKEN='));

const token = tokenLine ? tokenLine.slice('NETLIFY_AUTH_TOKEN='.length).trim() : '';

function createEventualStore(name: string) {
    return getStore({ name, siteID: SITE_ID, token });
}

function createStrongStore(name: string) {
    return getStore({ consistency: 'strong', name, siteID: SITE_ID, token });
}

async function sweepTestKeys(): Promise<void> {
    const store = createStrongStore('tests');

    const { blobs } = await store.list({ prefix: SWEEP_PREFIX });

    await Promise.allSettled(blobs.map(blob => store.delete(blob.key)));

    const { blobs: remaining } = await store.list({ prefix: SWEEP_PREFIX });

    expect(remaining).toHaveLength(0);
}

test.describe('netlify blobs', () => {
    test.skip(!token, 'NETLIFY_AUTH_TOKEN missing');

    test.beforeEach(() => test.setTimeout(TEST_TIMEOUT));

    test.beforeAll(async () => {
        await sweepTestKeys();
    });

    test.afterAll(async () => {
        await sweepTestKeys();
    });

    test.describe('events store', () => {
        test('lists a non-empty set of date-shaped keys', async () => {
            const store = createEventualStore('events');

            const { blobs } = await store.list();

            const keys = blobs.map(blob => blob.key);

            expect(keys.length).toBeGreaterThan(0);
            expect(keys.filter(key => !DATE_KEY.test(key))).toEqual([]);
        });
    });

    test.describe('tests store', () => {
        test('round-trips an object through setJSON and get', async () => {
            const key = `${PREFIX}roundtrip`;
            const payload = { active: true, count: 3, title: 'InterSub blob round trip' };
            const store = createEventualStore('tests');

            try {
                await store.setJSON(key, payload);

                const result: Record<string, unknown> = await store.get(key, { type: 'json' });

                expect(result).toEqual(payload);
            } finally {
                await store.delete(key);
            }
        });

        test('resolves null for a missing key', async () => {
            const store = createEventualStore('tests');

            const result: Record<string, unknown> | null = await store.get(`${PREFIX}absent`, { type: 'json' });

            expect(result).toBeNull();
        });

        test('lists written keys and respects a prefix', async () => {
            const keys = [`${PREFIX}list-a`, `${PREFIX}list-b`];
            const store = createEventualStore('tests');

            try {
                await Promise.all(keys.map(key => store.setJSON(key, { key })));

                const { blobs } = await store.list({ prefix: `${PREFIX}list-` });

                const listed = blobs.map(blob => blob.key).sort();

                expect(listed).toEqual(keys);
            } finally {
                await Promise.allSettled(keys.map(key => store.delete(key)));
            }
        });

        test('deletes a key so subsequent gets resolve null', async () => {
            const key = `${PREFIX}removal`;
            const store = createEventualStore('tests');

            try {
                await store.setJSON(key, { pending: true });

                const written: Record<string, unknown> = await store.get(key, { type: 'json' });

                expect(written).toEqual({ pending: true });

                await store.delete(key);

                const removed: Record<string, unknown> | null = await store.get(key, { type: 'json' });

                expect(removed).toBeNull();
            } finally {
                await store.delete(key);
            }
        });

        test('lists and reads back a concurrently written batch of keys', async () => {
            const keys = [0, 1, 2, 3, 4].map(index => `${PREFIX}batch-${index}`);
            const store = createEventualStore('tests');

            try {
                await Promise.all(keys.map((key, index) => store.setJSON(key, { index, key })));

                const { blobs } = await store.list({ prefix: `${PREFIX}batch-` });

                const payloads: Record<string, unknown>[] = await Promise.all(
                    keys.map(key => store.get(key, { type: 'json' })),
                );

                expect(blobs.map(blob => blob.key).sort()).toEqual(keys);
                expect(payloads).toEqual(keys.map((key, index) => ({ index, key })));
            } finally {
                await Promise.allSettled(keys.map(key => store.delete(key)));
            }
        });

        test('round-trips a write and read pair through a strong-consistency store', async () => {
            const key = `${PREFIX}strong`;
            const payload = { consistency: 'strong', run: process.pid };
            const store = createStrongStore('tests');

            try {
                await store.setJSON(key, payload);

                const result: Record<string, unknown> = await store.get(key, { type: 'json' });

                expect(result).toEqual(payload);
            } finally {
                await store.delete(key);
            }
        });
    });
});
