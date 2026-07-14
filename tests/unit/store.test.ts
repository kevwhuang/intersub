import { afterEach, describe, expect, test, vi } from 'vitest';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import {
    compareByDateDescending,
    compareByNumericId,
    getEvents,
    getOutcomes,
    getTestimonials,
} from '../../src/lib/store';

import type { Mock } from 'vitest';

interface StoreStub {
    get: Mock<(key: string) => Promise<Record<string, unknown> | null>>;
    list: Mock<() => Promise<{ blobs: { key: string }[] }>>;
}

const contentRoot = join(process.cwd(), 'src/content');

function buildStore(payloads: Record<string, Record<string, unknown> | null>) {
    return {
        get: vi.fn(async (key: string) => payloads[key] ?? null),
        list: vi.fn(async () => ({ blobs: Object.keys(payloads).map(key => ({ key })) })),
    };
}

async function importProductionStore(getStoreStub: () => StoreStub) {
    vi.resetModules();
    vi.doMock('@netlify/blobs', () => ({ getStore: getStoreStub }));
    vi.doMock('../../src/lib/constants', async (importOriginal) => {
        const original = await importOriginal<typeof import('../../src/lib/constants')>();

        return { ...original, IS_DEV: false };
    });

    return import('../../src/lib/store');
}

function listIds(collection: string) {
    return readdirSync(join(contentRoot, collection))
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
}

function readDate(collection: string, id: string) {
    const data = JSON.parse(readFileSync(join(contentRoot, collection, `${id}.json`), 'utf-8')) as { date: string };

    return data.date;
}

describe('compareByDateDescending', () => {
    test('sorts later dates first', () => {
        expect(compareByDateDescending({ date: '2026-06-15' }, { date: '2026-04-25' })).toBeLessThan(0);
        expect(compareByDateDescending({ date: '2026-04-25' }, { date: '2026-06-15' })).toBeGreaterThan(0);
        expect(compareByDateDescending({ date: '2026-06-15' }, { date: '2026-06-15' })).toBe(0);
    });

    test('treats missing dates as empty strings', () => {
        expect(compareByDateDescending({}, { date: '2026-04-25' })).toBeGreaterThan(0);
        expect(compareByDateDescending({ date: '2026-04-25' }, {})).toBeLessThan(0);
        expect(compareByDateDescending({}, {})).toBe(0);
    });
});

describe('compareByNumericId', () => {
    test('sorts numeric ids ascending', () => {
        expect(compareByNumericId({ id: '2' }, { id: '10' })).toBeLessThan(0);
        expect(compareByNumericId({ id: '10' }, { id: '2' })).toBeGreaterThan(0);
        expect(compareByNumericId({ id: '3' }, { id: '3' })).toBe(0);
    });
});

describe('getEvents', () => {
    test('returns every event sorted date-descending with filename-stem ids', async () => {
        const events = await getEvents();

        const expectedIds = listIds('events')
            .map(id => ({ date: readDate('events', id), id }))
            .sort((entryA, entryB) => entryB.date.localeCompare(entryA.date))
            .map(entry => entry.id);

        expect(events.map(event => event.id)).toEqual(expectedIds);
    });
});

describe('getOutcomes', () => {
    test('returns every outcome sorted numerically ascending by id', async () => {
        const outcomes = await getOutcomes();
        const expectedIds = listIds('outcomes').sort((idA, idB) => Number(idA) - Number(idB));

        expect(outcomes.map(outcome => outcome.id)).toEqual(expectedIds);
    });
});

describe('getTestimonials', () => {
    test('returns all four testimonials with expected ids', async () => {
        const testimonials = await getTestimonials();
        const expectedIds = listIds('testimonials').sort();

        expect(testimonials).toHaveLength(4);
        expect(testimonials.map(testimonial => testimonial.id).sort()).toEqual(expectedIds);
    });
});

describe('loadCollection', () => {
    afterEach(() => {
        vi.doUnmock('@netlify/blobs');
        vi.doUnmock('../../src/lib/constants');
        vi.resetModules();
    });

    test('lists blobs in production and fetches each entry as json with the key as id', async () => {
        const store = buildStore({
            'first-client': { name: 'Ada', role: 'CTO' },
            'second-client': { name: 'Lin', role: 'Director' },
        });

        const production = await importProductionStore(() => store);

        await expect(production.getTestimonials()).resolves.toEqual([
            { id: 'first-client', name: 'Ada', role: 'CTO' },
            { id: 'second-client', name: 'Lin', role: 'Director' },
        ]);
        expect(store.list).toHaveBeenCalledTimes(1);
        expect(store.get).toHaveBeenCalledWith('first-client', { type: 'json' });
        expect(store.get).toHaveBeenCalledWith('second-client', { type: 'json' });
    });

    test('drops blobs whose payload is null', async () => {
        const store = buildStore({
            broken: null,
            intact: { name: 'Kept' },
        });

        const production = await importProductionStore(() => store);

        await expect(production.getTestimonials()).resolves.toEqual([{ id: 'intact', name: 'Kept' }]);
    });

    test('sorts blob-backed events date-descending', async () => {
        const store = buildStore({
            earliest: { date: '2026-01-10' },
            latest: { date: '2026-06-15' },
            middle: { date: '2026-03-01' },
        });

        const production = await importProductionStore(() => store);

        const blobEvents = await production.getEvents();

        expect(blobEvents.map(event => event.id)).toEqual(['latest', 'middle', 'earliest']);
    });

    test('falls back to the astro:content seed when getStore throws', async () => {
        const production = await importProductionStore(() => {
            throw new Error('blobs unavailable');
        });

        const seeded = await production.getOutcomes();
        const expectedIds = listIds('outcomes').sort((idA, idB) => Number(idA) - Number(idB));

        expect(seeded.map(outcome => outcome.id)).toEqual(expectedIds);
    });

    test('opens the store with strong consistency and the collection name', async () => {
        const getStoreStub = vi.fn(() => buildStore({}));

        const production = await importProductionStore(getStoreStub);

        await production.getOutcomes();

        expect(getStoreStub).toHaveBeenCalledExactlyOnceWith({ consistency: 'strong', name: 'outcomes' });
    });
});
