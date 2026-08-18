import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { basename, join } from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';

import { DELETE, GET, POST } from '../../src/pages/api/outcomes';

import type { Mock } from 'vitest';

type RouteContext = Parameters<typeof GET>[0];
type RoutesModule = typeof import('../../src/pages/api/outcomes');

interface BlobStoreStub {
    delete: Mock<(key: string) => Promise<void>>;
    get: Mock<(key: string) => Promise<Record<string, unknown> | null>>;
    list: Mock<() => Promise<{ blobs: { key: string }[] }>>;
    setJSON: Mock<(key: string, value: Record<string, unknown>) => Promise<void>>;
}

const OUTCOME_ID = '1';

const SENTINEL_OUTCOME = {
    points: ['Sentinel point one', 'Sentinel point two'],
    summary: 'Sentinel lifecycle summary for automated tests.',
    title: 'Sentinel Lifecycle Outcome',
} as const;

const UPDATED_SUMMARY = 'Updated sentinel lifecycle summary.';

const createdIds: string[] = [];
const outcomesDir = join(process.cwd(), 'src/content/outcomes');

const outcomePath = join(outcomesDir, `${OUTCOME_ID}.json`);

const existingOutcome: Record<string, unknown> = JSON.parse(readFileSync(outcomePath, 'utf-8'));

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
        request: new Request('http://localhost/api/outcomes', {
            body,
            headers: { 'Content-Type': 'application/json' },
            method,
        }),
    } as RouteContext;
}

async function createSentinel(): Promise<string> {
    const id = getNextOutcomeId();

    createdIds.push(id);

    const response = await postJson(SENTINEL_OUTCOME);

    const result: Record<string, unknown> = await response.json();

    expect(response.status).toBe(200);
    expect(result.id).toBe(id);

    return id;
}

async function deleteJson(id: string): Promise<Response> {
    return DELETE(createContext('DELETE', JSON.stringify({ id })));
}

function getNextOutcomeId(): string {
    const ids = readdirSync(outcomesDir)
        .filter(file => file.endsWith('.json'))
        .map(file => parseInt(file.replace('.json', ''), 10))
        .filter(value => !Number.isNaN(value));

    return String(ids.reduce((max, value) => Math.max(max, value), 0) + 1);
}

async function importProductionRoutes(getStoreStub: () => BlobStoreStub, isAuthorized = true): Promise<RoutesModule> {
    vi.resetModules();
    vi.doMock('@netlify/blobs', () => ({ getStore: getStoreStub }));
    vi.doMock('../../src/lib/authServer', () => ({ verifyAuth: vi.fn(async () => isAuthorized) }));

    vi.doMock('../../src/lib/constants', async (importOriginal) => {
        const original = await importOriginal<typeof import('../../src/lib/constants')>();

        return { ...original, IS_DEV: false };
    });

    return import('../../src/pages/api/outcomes');
}

function listCommittedFiles(): string[] {
    return execSync('git ls-files src/content/outcomes', { encoding: 'utf-8' })
        .split('\n')
        .map(line => basename(line))
        .filter(file => file.endsWith('.json'))
        .sort();
}

async function postJson(body: Record<string, unknown>): Promise<Response> {
    return POST(createContext('POST', JSON.stringify(body)));
}

function removeCreated() {
    for (const id of createdIds) {
        rmSync(join(outcomesDir, `${id}.json`), { force: true });
    }
}

function snapshotCommitted(): Record<string, string> {
    return Object.fromEntries(committedNames.map(file => [file, readFileSync(join(outcomesDir, file), 'utf-8')]));
}

function snapshotTree(): Record<string, string> {
    return Object.fromEntries(
        readdirSync(outcomesDir)
            .filter(file => file.endsWith('.json'))
            .map(file => [file, readFileSync(join(outcomesDir, file), 'utf-8')]),
    );
}

beforeAll(() => {
    committedNames = listCommittedFiles();

    for (const file of readdirSync(outcomesDir)) {
        if (file.endsWith('.json') && !committedNames.includes(file)) rmSync(join(outcomesDir, file), { force: true });
    }

    committedSnapshot = snapshotCommitted();
});

afterAll(() => {
    removeCreated();

    expect(snapshotCommitted()).toEqual(committedSnapshot);
    expect(createdIds.some(id => existsSync(join(outcomesDir, `${id}.json`)))).toBe(false);
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
        const response = await DELETE(createContext('DELETE', JSON.stringify({ id: '999' })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(404);
        expect(result.error).toBe('Outcome not found');
    });
});

describe('GET', () => {
    test('returns all outcomes sorted by numeric id ascending', async () => {
        const response = await GET(createContext('GET'));

        const outcomes: Record<string, unknown>[] = await response.json();

        const expected = readdirSync(outcomesDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''))
            .sort((idA, idB) => Number(idA) - Number(idB));

        expect(response.status).toBe(200);
        expect(outcomes.map(entry => entry.id)).toEqual(expected);
    });
});

describe('POST', () => {
    test('accepts a byte-identical update for an existing outcome', async () => {
        const before = readFileSync(outcomePath, 'utf-8');

        const response = await postJson({ ...existingOutcome, id: OUTCOME_ID });

        const result: Record<string, unknown> = await response.json();

        const after = readFileSync(outcomePath, 'utf-8');

        expect(response.status).toBe(200);
        expect(result.id).toBe(OUTCOME_ID);
        expect(after).toBe(before);
    });

    test('rejects a malformed body', async () => {
        const response = await POST(createContext('POST', '{'));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Invalid request body');
    });

    test('rejects an empty points array', async () => {
        const response = await postJson({ ...existingOutcome, id: OUTCOME_ID, points: [] });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('At least one outcome is required');
    });

    test('rejects points containing only blank strings', async () => {
        const response = await postJson({ ...existingOutcome, id: OUTCOME_ID, points: ['', '   '] });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('At least one outcome is required');
    });

    test('rejects a blank summary', async () => {
        const response = await postJson({ ...existingOutcome, id: OUTCOME_ID, summary: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Summary is required');
    });

    test('rejects a blank title', async () => {
        const response = await postJson({ ...existingOutcome, id: OUTCOME_ID, title: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Title is required');
    });

    test('rejects an unknown id', async () => {
        const response = await postJson({ ...existingOutcome, id: '999' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(404);
        expect(result.error).toBe('Outcome not found');
    });
});

describe('lifecycle', () => {
    test('creates an outcome with the next numeric id', async () => {
        try {
            const id = await createSentinel();

            const bytes = readFileSync(join(outcomesDir, `${id}.json`), 'utf-8');

            expect(bytes).toBe(JSON.stringify(SENTINEL_OUTCOME, null, 4));
        } finally {
            removeCreated();
        }
    });

    test('updates a created outcome by id', async () => {
        try {
            const id = await createSentinel();

            const response = await postJson({ ...SENTINEL_OUTCOME, id, summary: UPDATED_SUMMARY });

            const result: Record<string, unknown> = await response.json();

            const stored: Record<string, unknown> = JSON.parse(readFileSync(join(outcomesDir, `${id}.json`), 'utf-8'));

            expect(response.status).toBe(200);
            expect(result.id).toBe(id);
            expect(stored.summary).toBe(UPDATED_SUMMARY);
        } finally {
            removeCreated();
        }
    });

    test('deletes a created outcome and rejects a second delete', async () => {
        try {
            const id = await createSentinel();

            const response = await deleteJson(id);

            const result: Record<string, unknown> = await response.json();

            const repeat = await deleteJson(id);

            const repeatResult: Record<string, unknown> = await repeat.json();

            expect(response.status).toBe(200);
            expect(result.deleted).toBe(true);
            expect(existsSync(join(outcomesDir, `${id}.json`))).toBe(false);
            expect(repeat.status).toBe(404);
            expect(repeatResult.error).toBe('Outcome not found');
        } finally {
            removeCreated();
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

    test('creates an outcome with the next numeric id through the blob store', async () => {
        const store = buildBlobStore({
            997: { points: ['Existing point'], summary: 'Existing summary', title: 'Existing Title' },
            998: { points: ['Existing point'], summary: 'Existing summary', title: 'Existing Title' },
        });

        const getStoreStub = vi.fn(() => store);

        const routes = await importProductionRoutes(getStoreStub);

        const response = await routes.POST(createContext('POST', JSON.stringify({
            points: ['  Sentinel point one  ', '', 'Sentinel point two'],
            summary: `  ${SENTINEL_OUTCOME.summary}  `,
            title: `  ${SENTINEL_OUTCOME.title}  `,
        })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.id).toBe('999');
        expect(getStoreStub).toHaveBeenCalledWith({ consistency: 'strong', name: 'outcomes' });
        expect(store.setJSON).toHaveBeenCalledExactlyOnceWith('999', SENTINEL_OUTCOME);
        expect(existsSync(join(outcomesDir, '999.json'))).toBe(false);
    });

    test('rejects an unauthenticated write with 401', async () => {
        const store = buildBlobStore({});

        const routes = await importProductionRoutes(() => store, false);

        const postResponse = await routes.POST(createContext('POST', JSON.stringify(SENTINEL_OUTCOME)));

        const postResult: Record<string, unknown> = await postResponse.json();

        const deleteResponse = await routes.DELETE(createContext('DELETE', JSON.stringify({ id: OUTCOME_ID })));

        const deleteResult: Record<string, unknown> = await deleteResponse.json();

        expect(postResponse.status).toBe(401);
        expect(postResult.error).toBe('Unauthorized');
        expect(deleteResponse.status).toBe(401);
        expect(deleteResult.error).toBe('Unauthorized');
        expect(store.setJSON).not.toHaveBeenCalled();
        expect(store.delete).not.toHaveBeenCalled();
    });

    test('deletes an outcome from the blob store by its string id', async () => {
        const store = buildBlobStore({ 999: { ...SENTINEL_OUTCOME } });

        const getStoreStub = vi.fn(() => store);

        const routes = await importProductionRoutes(getStoreStub);

        const response = await routes.DELETE(createContext('DELETE', JSON.stringify({ id: 999 })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.deleted).toBe(true);
        expect(getStoreStub).toHaveBeenCalledWith({ consistency: 'strong', name: 'outcomes' });
        expect(store.delete).toHaveBeenCalledExactlyOnceWith('999');
    });

    test('lists blob-backed outcomes numerically ascending through the loader', async () => {
        const store = buildBlobStore({
            '02': { ...SENTINEL_OUTCOME },
            '3': { ...SENTINEL_OUTCOME },
            '10': { ...SENTINEL_OUTCOME },
        });

        const routes = await importProductionRoutes(() => store);

        const response = await routes.GET(createContext('GET'));

        const outcomes: Record<string, unknown>[] = await response.json();

        expect(response.status).toBe(200);
        expect(outcomes.map(entry => entry.id)).toEqual(['02', '3', '10']);
        expect(store.list).toHaveBeenCalledTimes(1);
        expect(store.get).toHaveBeenCalledWith('02', { type: 'json' });
        expect(store.get).toHaveBeenCalledWith('3', { type: 'json' });
        expect(store.get).toHaveBeenCalledWith('10', { type: 'json' });
    });
});
