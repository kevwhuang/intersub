import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { basename, join } from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';

import { DELETE, GET, POST } from '../../src/pages/api/events';

import type { Mock } from 'vitest';

type RouteContext = Parameters<typeof GET>[0];
type RoutesModule = typeof import('../../src/pages/api/events');

interface BlobStoreStub {
    delete: Mock<(key: string) => Promise<void>>;
    get: Mock<(key: string) => Promise<Record<string, unknown> | null>>;
    list: Mock<() => Promise<{ blobs: { key: string }[] }>>;
    setJSON: Mock<(key: string, value: Record<string, unknown>) => Promise<void>>;
}

const EVENT_ID = '2026-06-15';
const SENTINEL_ID = '1990-01-01';
const SENTINEL_RENAMED_ID = '1990-01-02';

const SENTINEL_IDS = [SENTINEL_ID, SENTINEL_RENAMED_ID];
const SENTINEL_TIME = '09:00\u201311:00';
const UPDATED_TITLE = 'Updated Sentinel Event';

const eventsDir = join(process.cwd(), 'src/content/events');

const eventPath = join(eventsDir, `${EVENT_ID}.json`);

const existingEvent: Record<string, unknown> = JSON.parse(readFileSync(eventPath, 'utf-8'));

const sentinelEvent = {
    content: 'Sentinel lifecycle event for automated tests.',
    date: SENTINEL_ID,
    location: 'Sentinel Test Lab',
    time: '9:00-11:00',
    title: 'Sentinel Lifecycle Event',
};

let committedNames: string[] = [];
let committedSnapshot: Record<string, string> = {};

function buildBlobStore(payloads: Record<string, Record<string, unknown>>): BlobStoreStub {
    return {
        delete: vi.fn(async (key: string) => {
            delete payloads[key];
        }),
        get: vi.fn(async (key: string) => payloads[key] ?? null),
        list: vi.fn(async () => ({ blobs: Object.keys(payloads).map(key => ({ key })) })),
        setJSON: vi.fn(async (key: string, value: Record<string, unknown>) => {
            payloads[key] = value;
        }),
    };
}

function createContext(method: string, body?: string): RouteContext {
    return {
        clientAddress: '127.0.0.1',
        request: new Request('http://localhost/api/events', {
            body,
            headers: { 'Content-Type': 'application/json' },
            method,
        }),
    } as RouteContext;
}

async function createSentinel(): Promise<void> {
    const response = await postJson(sentinelEvent);

    expect(response.status).toBe(200);
}

async function deleteJson(id: string): Promise<Response> {
    return DELETE(createContext('DELETE', JSON.stringify({ id })));
}

async function importProductionRoutes(getStoreStub: () => BlobStoreStub): Promise<RoutesModule> {
    vi.resetModules();
    vi.doMock('@netlify/blobs', () => ({ getStore: getStoreStub }));
    vi.doMock('../../src/lib/authServer', () => ({ verifyAuth: vi.fn(async () => true) }));
    vi.doMock('../../src/lib/constants', async (importOriginal) => {
        const original = await importOriginal<typeof import('../../src/lib/constants')>();

        return { ...original, IS_DEV: false };
    });

    return import('../../src/pages/api/events');
}

function listCommittedFiles(): string[] {
    return execSync('git ls-files src/content/events', { encoding: 'utf-8' })
        .split('\n')
        .map(line => basename(line))
        .filter(file => file.endsWith('.json'))
        .sort();
}

async function postJson(body: Record<string, unknown>): Promise<Response> {
    return POST(createContext('POST', JSON.stringify(body)));
}

function removeSentinels() {
    for (const id of SENTINEL_IDS) rmSync(join(eventsDir, `${id}.json`), { force: true });
}

function snapshotCommitted(): Record<string, string> {
    return Object.fromEntries(committedNames.map(file => [file, readFileSync(join(eventsDir, file), 'utf-8')]));
}

function snapshotTree(): Record<string, string> {
    return Object.fromEntries(
        readdirSync(eventsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => [file, readFileSync(join(eventsDir, file), 'utf-8')]),
    );
}

beforeAll(() => {
    committedNames = listCommittedFiles();

    for (const file of readdirSync(eventsDir)) {
        if (file.endsWith('.json') && !committedNames.includes(file)) rmSync(join(eventsDir, file), { force: true });
    }

    committedSnapshot = snapshotCommitted();
});

afterAll(() => {
    removeSentinels();

    expect(snapshotCommitted()).toEqual(committedSnapshot);
    expect(SENTINEL_IDS.some(id => existsSync(join(eventsDir, `${id}.json`)))).toBe(false);
});

describe('DELETE', () => {
    test('rejects a malformed body', async () => {
        const response = await DELETE(createContext('DELETE', '{'));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Invalid request body');
    });

    test('rejects a missing id', async () => {
        const response = await DELETE(createContext('DELETE', JSON.stringify({})));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Missing id');
    });

    test('rejects an unknown id', async () => {
        const response = await DELETE(createContext('DELETE', JSON.stringify({ id: '1999-01-01' })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(404);
        expect(result.error).toBe('Event not found');
    });
});

describe('GET', () => {
    test('returns all events sorted by date descending', async () => {
        const response = await GET(createContext('GET'));

        const events: Record<string, unknown>[] = await response.json();

        const dates = events.map(entry => String(entry.date));

        const expected = readdirSync(eventsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''))
            .sort()
            .reverse();

        expect(response.status).toBe(200);
        expect(events.map(entry => entry.id)).toEqual(expected);
        expect(dates).toEqual([...dates].sort().reverse());
    });

    test('sends a no-store cache header', async () => {
        const response = await GET(createContext('GET'));

        expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
});

describe('POST', () => {
    test('accepts a byte-identical update for an existing event', async () => {
        const before = readFileSync(eventPath, 'utf-8');

        const response = await postJson({ ...existingEvent, id: EVENT_ID });

        const result: Record<string, unknown> = await response.json();

        const after = readFileSync(eventPath, 'utf-8');

        expect(response.status).toBe(200);
        expect(result.id).toBe(EVENT_ID);
        expect(after).toBe(before);
    });

    test('normalizes the time range to an en dash', async () => {
        const response = await postJson({ ...existingEvent, id: EVENT_ID });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.time).toBe('19:00\u201321:00');
    });

    test('rejects a malformed body', async () => {
        const response = await POST(createContext('POST', '{'));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Invalid request body');
    });

    test('rejects a blank content', async () => {
        const response = await postJson({ ...existingEvent, content: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Content is required');
    });

    test('rejects an invalid cover path', async () => {
        const response = await postJson({ ...existingEvent, cover: 'images/bad.bmp' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Cover must be a URL or internal image path');
    });

    test('rejects a blank date', async () => {
        const response = await postJson({ ...existingEvent, date: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Date must be a valid date in YYYY-MM-DD format');
    });

    test('rejects an invalid date format', async () => {
        const response = await postJson({ ...existingEvent, date: '15-06-2026' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Date must be a valid date in YYYY-MM-DD format');
    });

    test('rejects an impossible calendar date', async () => {
        const response = await postJson({ ...existingEvent, date: '2026-02-30' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Date must be a valid date in YYYY-MM-DD format');
    });

    test('rejects an unknown level', async () => {
        const response = await postJson({ ...existingEvent, level: 'Expert' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Level is invalid');
    });

    test('rejects a blank location', async () => {
        const response = await postJson({ ...existingEvent, location: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Location is required');
    });

    test('rejects an invalid time format', async () => {
        const response = await postJson({ ...existingEvent, time: '7pm to 9pm' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Time must be a 24-hour range');
    });

    test('rejects a blank title', async () => {
        const response = await postJson({ ...existingEvent, title: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Title is required');
    });

    test('rejects an unknown previous id', async () => {
        const response = await postJson({ ...existingEvent, id: '1999-01-01' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(404);
        expect(result.error).toBe('Event not found');
    });

    test('rejects a duplicate date without an id', async () => {
        const response = await postJson({ ...existingEvent });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(409);
        expect(result.error).toBe('An event already exists on this date');
    });
});

describe('lifecycle', () => {
    test('creates a sentinel event with a normalized time', async () => {
        try {
            const response = await postJson(sentinelEvent);

            const result: Record<string, unknown> = await response.json();

            const bytes = readFileSync(join(eventsDir, `${SENTINEL_ID}.json`), 'utf-8');

            const expected = JSON.stringify({
                content: sentinelEvent.content,
                date: sentinelEvent.date,
                location: sentinelEvent.location,
                time: SENTINEL_TIME,
                title: sentinelEvent.title,
            }, null, 4);

            const listResponse = await GET(createContext('GET'));

            const events: Record<string, unknown>[] = await listResponse.json();

            expect(response.status).toBe(200);
            expect(result.id).toBe(SENTINEL_ID);
            expect(result.time).toBe(SENTINEL_TIME);
            expect(bytes).toBe(expected);
            expect(events.at(-1)?.id).toBe(SENTINEL_ID);
        } finally {
            removeSentinels();
        }
    });

    test('renames the sentinel event when the date changes', async () => {
        try {
            await createSentinel();

            const response = await postJson({ ...sentinelEvent, date: SENTINEL_RENAMED_ID, id: SENTINEL_ID });

            const result: Record<string, unknown> = await response.json();

            expect(response.status).toBe(200);
            expect(result.id).toBe(SENTINEL_RENAMED_ID);
            expect(existsSync(join(eventsDir, `${SENTINEL_ID}.json`))).toBe(false);
            expect(existsSync(join(eventsDir, `${SENTINEL_RENAMED_ID}.json`))).toBe(true);
        } finally {
            removeSentinels();
        }
    });

    test('keeps the same file when only the title changes', async () => {
        try {
            await createSentinel();

            const response = await postJson({ ...sentinelEvent, id: SENTINEL_ID, title: UPDATED_TITLE });

            const result: Record<string, unknown> = await response.json();

            const stored: Record<string, unknown> = JSON.parse(readFileSync(join(eventsDir, `${SENTINEL_ID}.json`), 'utf-8'));

            expect(response.status).toBe(200);
            expect(result.id).toBe(SENTINEL_ID);
            expect(stored.title).toBe(UPDATED_TITLE);
            expect(existsSync(join(eventsDir, `${SENTINEL_RENAMED_ID}.json`))).toBe(false);
        } finally {
            removeSentinels();
        }
    });

    test('deletes the sentinel event and rejects a second delete', async () => {
        try {
            await createSentinel();

            const response = await deleteJson(SENTINEL_ID);

            const result: Record<string, unknown> = await response.json();

            const repeat = await deleteJson(SENTINEL_ID);

            const repeatResult: Record<string, unknown> = await repeat.json();

            expect(response.status).toBe(200);
            expect(result.deleted).toBe(true);
            expect(existsSync(join(eventsDir, `${SENTINEL_ID}.json`))).toBe(false);
            expect(repeat.status).toBe(404);
            expect(repeatResult.error).toBe('Event not found');
        } finally {
            removeSentinels();
        }
    });
});

describe('production blobs', () => {
    let treeSnapshot: Record<string, string> = {};

    beforeEach(() => {
        treeSnapshot = snapshotTree();
    });

    afterEach(() => {
        vi.doUnmock('@netlify/blobs');
        vi.doUnmock('../../src/lib/authServer');
        vi.doUnmock('../../src/lib/constants');
        vi.resetModules();
        vi.restoreAllMocks();

        expect(snapshotTree()).toEqual(treeSnapshot);
    });

    test('creates an event through the blob store without touching the content tree', async () => {
        const store = buildBlobStore({});

        const getStoreStub = vi.fn(() => store);

        const routes = await importProductionRoutes(getStoreStub);

        const response = await routes.POST(createContext('POST', JSON.stringify(sentinelEvent)));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.id).toBe(SENTINEL_ID);
        expect(getStoreStub).toHaveBeenCalledWith({ consistency: 'strong', name: 'events' });
        expect(store.setJSON).toHaveBeenCalledExactlyOnceWith(SENTINEL_ID, {
            content: sentinelEvent.content,
            date: sentinelEvent.date,
            location: sentinelEvent.location,
            time: SENTINEL_TIME,
            title: sentinelEvent.title,
        });
        expect(existsSync(join(eventsDir, `${SENTINEL_ID}.json`))).toBe(false);
    });

    test('renames an event by writing the new key and deleting the previous one', async () => {
        const store = buildBlobStore({ [SENTINEL_ID]: { ...sentinelEvent } });

        const routes = await importProductionRoutes(() => store);

        const response = await routes.POST(createContext('POST', JSON.stringify({ ...sentinelEvent, date: SENTINEL_RENAMED_ID, id: SENTINEL_ID })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.id).toBe(SENTINEL_RENAMED_ID);
        expect(store.setJSON).toHaveBeenCalledExactlyOnceWith(SENTINEL_RENAMED_ID, {
            content: sentinelEvent.content,
            date: SENTINEL_RENAMED_ID,
            location: sentinelEvent.location,
            time: SENTINEL_TIME,
            title: sentinelEvent.title,
        });
        expect(store.delete).toHaveBeenCalledExactlyOnceWith(SENTINEL_ID);
        expect(SENTINEL_IDS.some(id => existsSync(join(eventsDir, `${id}.json`)))).toBe(false);
    });

    test('deletes an event from the blob store by its string id', async () => {
        const store = buildBlobStore({ [SENTINEL_ID]: { ...sentinelEvent } });

        const getStoreStub = vi.fn(() => store);

        const routes = await importProductionRoutes(getStoreStub);

        const response = await routes.DELETE(createContext('DELETE', JSON.stringify({ id: SENTINEL_ID })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.deleted).toBe(true);
        expect(getStoreStub).toHaveBeenCalledWith({ consistency: 'strong', name: 'events' });
        expect(store.delete).toHaveBeenCalledExactlyOnceWith(SENTINEL_ID);
    });

    test('lists blob-backed events date-descending through the loader', async () => {
        const store = buildBlobStore({
            earliest: { date: '1990-01-10' },
            latest: { date: '1990-06-15' },
            middle: { date: '1990-03-01' },
        });

        const routes = await importProductionRoutes(() => store);

        const response = await routes.GET(createContext('GET'));

        const events: Record<string, unknown>[] = await response.json();

        expect(response.status).toBe(200);
        expect(events.map(entry => entry.id)).toEqual(['latest', 'middle', 'earliest']);
        expect(store.list).toHaveBeenCalledTimes(1);
        expect(store.get).toHaveBeenCalledWith('latest', { type: 'json' });
    });
});
