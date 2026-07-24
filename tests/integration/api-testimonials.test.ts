import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { basename, join } from 'node:path';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';

import { DELETE, GET, POST } from '../../src/pages/api/testimonials';

import type { Mock } from 'vitest';

type RouteContext = Parameters<typeof GET>[0];
type RoutesModule = typeof import('../../src/pages/api/testimonials');

interface BlobStoreStub {
    delete: Mock<(key: string) => Promise<void>>;
    get: Mock<(key: string) => Promise<Record<string, unknown> | null>>;
    list: Mock<() => Promise<{ blobs: { key: string }[] }>>;
    setJSON: Mock<(key: string, value: Record<string, unknown>) => Promise<void>>;
}

const SENTINEL_ID = 'test-sentinel-qa-robot';
const TESTIMONIAL_ID = 'herry-j-consultant';
const UPDATED_QUOTE = 'Updated sentinel lifecycle quote.';

const testimonialsDir = join(process.cwd(), 'src/content/testimonials');

const testimonialPath = join(testimonialsDir, `${TESTIMONIAL_ID}.json`);

const existingTestimonial: Record<string, unknown> = JSON.parse(readFileSync(testimonialPath, 'utf-8'));

const sentinelTestimonial = {
    industry: 'Software Testing',
    name: 'Test Sentinel',
    quote: 'Sentinel lifecycle quote for automated tests.',
    role: 'QA Robot',
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
        request: new Request('http://localhost/api/testimonials', {
            body,
            headers: { 'Content-Type': 'application/json' },
            method,
        }),
    } as RouteContext;
}

async function createSentinel(): Promise<void> {
    const response = await postJson(sentinelTestimonial);

    const result: Record<string, unknown> = await response.json();

    expect(response.status).toBe(200);
    expect(result.id).toBe(SENTINEL_ID);
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

    return import('../../src/pages/api/testimonials');
}

function listCommittedFiles(): string[] {
    return execSync('git ls-files src/content/testimonials', { encoding: 'utf-8' })
        .split('\n')
        .map(line => basename(line))
        .filter(file => file.endsWith('.json'))
        .sort();
}

async function postJson(body: Record<string, unknown>): Promise<Response> {
    return POST(createContext('POST', JSON.stringify(body)));
}

function removeSentinel() {
    rmSync(join(testimonialsDir, `${SENTINEL_ID}.json`), { force: true });
}

function snapshotCommitted(): Record<string, string> {
    return Object.fromEntries(committedNames.map(file => [file, readFileSync(join(testimonialsDir, file), 'utf-8')]));
}

function snapshotTree(): Record<string, string> {
    return Object.fromEntries(
        readdirSync(testimonialsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => [file, readFileSync(join(testimonialsDir, file), 'utf-8')]),
    );
}

beforeAll(() => {
    committedNames = listCommittedFiles();

    for (const file of readdirSync(testimonialsDir)) {
        if (file.endsWith('.json') && !committedNames.includes(file)) {
            rmSync(join(testimonialsDir, file), { force: true });
        }
    }

    committedSnapshot = snapshotCommitted();
});

afterAll(() => {
    removeSentinel();

    expect(snapshotCommitted()).toEqual(committedSnapshot);
    expect(existsSync(join(testimonialsDir, `${SENTINEL_ID}.json`))).toBe(false);
});

describe('DELETE', () => {
    test('rejects an unknown id', async () => {
        const response = await DELETE(createContext('DELETE', JSON.stringify({ id: 'unknown-person' })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(404);
        expect(result.error).toBe('Testimonial not found');
    });
});

describe('GET', () => {
    test('returns all testimonials', async () => {
        const response = await GET(createContext('GET'));

        const testimonials: Record<string, unknown>[] = await response.json();

        const expected = readdirSync(testimonialsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''))
            .sort();

        expect(response.status).toBe(200);
        expect(testimonials.map(entry => entry.id).sort()).toEqual(expected);
    });
});

describe('POST', () => {
    test('accepts a byte-identical update for an existing testimonial', async () => {
        const before = readFileSync(testimonialPath, 'utf-8');

        const response = await postJson({ ...existingTestimonial, id: TESTIMONIAL_ID });

        const result: Record<string, unknown> = await response.json();

        const after = readFileSync(testimonialPath, 'utf-8');

        expect(response.status).toBe(200);
        expect(result.id).toBe(TESTIMONIAL_ID);
        expect(after).toBe(before);
    });

    test('rejects a blank industry', async () => {
        const response = await postJson({ ...existingTestimonial, id: TESTIMONIAL_ID, industry: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Industry is required');
    });

    test('rejects a blank name', async () => {
        const response = await postJson({ ...existingTestimonial, id: TESTIMONIAL_ID, name: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Name is required');
    });

    test('rejects a blank quote', async () => {
        const response = await postJson({ ...existingTestimonial, id: TESTIMONIAL_ID, quote: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Quote is required');
    });

    test('rejects a blank role', async () => {
        const response = await postJson({ ...existingTestimonial, id: TESTIMONIAL_ID, role: '' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Role is required');
    });

    test('rejects an unknown id', async () => {
        const response = await postJson({ ...existingTestimonial, id: 'unknown-person' });

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(404);
        expect(result.error).toBe('Testimonial not found');
    });

    test('rejects a duplicate name and role without an id', async () => {
        const before = readdirSync(testimonialsDir);

        const response = await postJson({ ...existingTestimonial });

        const result: Record<string, unknown> = await response.json();

        const after = readdirSync(testimonialsDir);

        expect(response.status).toBe(409);
        expect(result.error).toBe('A testimonial for this name and role already exists');
        expect(after).toEqual(before);
    });
});

describe('lifecycle', () => {
    test('creates a testimonial with a slugged id', async () => {
        try {
            await createSentinel();

            const bytes = readFileSync(join(testimonialsDir, `${SENTINEL_ID}.json`), 'utf-8');

            expect(bytes).toBe(JSON.stringify(sentinelTestimonial, null, 4));
        } finally {
            removeSentinel();
        }
    });

    test('rejects a duplicate creation for the same name and role', async () => {
        try {
            await createSentinel();

            const response = await postJson(sentinelTestimonial);

            const result: Record<string, unknown> = await response.json();

            expect(response.status).toBe(409);
            expect(result.error).toBe('A testimonial for this name and role already exists');
        } finally {
            removeSentinel();
        }
    });

    test('updates a created testimonial by id', async () => {
        try {
            await createSentinel();

            const response = await postJson({ ...sentinelTestimonial, id: SENTINEL_ID, quote: UPDATED_QUOTE });

            const result: Record<string, unknown> = await response.json();

            const stored: Record<string, unknown> = JSON.parse(readFileSync(join(testimonialsDir, `${SENTINEL_ID}.json`), 'utf-8'));

            expect(response.status).toBe(200);
            expect(result.id).toBe(SENTINEL_ID);
            expect(stored.quote).toBe(UPDATED_QUOTE);
        } finally {
            removeSentinel();
        }
    });

    test('deletes a created testimonial and rejects a second delete', async () => {
        try {
            await createSentinel();

            const response = await deleteJson(SENTINEL_ID);

            const result: Record<string, unknown> = await response.json();

            const repeat = await deleteJson(SENTINEL_ID);

            const repeatResult: Record<string, unknown> = await repeat.json();

            expect(response.status).toBe(200);
            expect(result.deleted).toBe(true);
            expect(existsSync(join(testimonialsDir, `${SENTINEL_ID}.json`))).toBe(false);
            expect(repeat.status).toBe(404);
            expect(repeatResult.error).toBe('Testimonial not found');
        } finally {
            removeSentinel();
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

    test('creates a testimonial with a slugged id through the blob store', async () => {
        const store = buildBlobStore({});

        const getStoreStub = vi.fn(() => store);

        const routes = await importProductionRoutes(getStoreStub);

        const response = await routes.POST(createContext('POST', JSON.stringify({
            industry: `  ${sentinelTestimonial.industry}  `,
            name: `  ${sentinelTestimonial.name}  `,
            quote: `  ${sentinelTestimonial.quote}  `,
            role: `  ${sentinelTestimonial.role}  `,
        })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.id).toBe(SENTINEL_ID);
        expect(getStoreStub).toHaveBeenCalledWith({ consistency: 'strong', name: 'testimonials' });
        expect(store.setJSON).toHaveBeenCalledExactlyOnceWith(SENTINEL_ID, sentinelTestimonial);
        expect(existsSync(join(testimonialsDir, `${SENTINEL_ID}.json`))).toBe(false);
    });

    test('rejects an update that collides with another entry on name and role', async () => {
        const store = buildBlobStore({
            'other-person': { industry: 'Finance', name: 'Other Person', quote: 'Great.', role: 'Director' },
            [SENTINEL_ID]: { ...sentinelTestimonial },
        });

        const routes = await importProductionRoutes(() => store);

        const response = await routes.POST(createContext('POST', JSON.stringify({
            id: SENTINEL_ID,
            industry: 'Finance',
            name: 'Other Person',
            quote: 'Rewritten.',
            role: 'Director',
        })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(409);
        expect(result.error).toBe('A testimonial for this name and role already exists');
        expect(store.setJSON).not.toHaveBeenCalled();
    });

    test('suffixes the id with a timestamp when the slug is already taken', async () => {
        const store = buildBlobStore({
            [SENTINEL_ID]: { industry: 'Finance', name: 'Different Person', quote: 'Fine.', role: 'Director' },
        });

        const routes = await importProductionRoutes(() => store);

        const response = await routes.POST(createContext('POST', JSON.stringify({ ...sentinelTestimonial })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(String(result.id)).toMatch(new RegExp(`^${SENTINEL_ID}-\\d{13}$`));
        expect(store.setJSON).toHaveBeenCalledExactlyOnceWith(String(result.id), sentinelTestimonial);
    });

    test('falls back to a timestamped testimonial id when the name and role slugify to nothing', async () => {
        const store = buildBlobStore({});

        const routes = await importProductionRoutes(() => store);

        const cjkTestimonial = { industry: 'Software Testing', name: '测试', quote: 'Sentinel quote.', role: '机器人' };

        const response = await routes.POST(createContext('POST', JSON.stringify(cjkTestimonial)));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(String(result.id)).toMatch(/^testimonial-\d{13}$/);
        expect(store.setJSON).toHaveBeenCalledExactlyOnceWith(String(result.id), cjkTestimonial);
    });

    test('deletes a testimonial from the blob store by its string id', async () => {
        const store = buildBlobStore({ [SENTINEL_ID]: { ...sentinelTestimonial } });

        const getStoreStub = vi.fn(() => store);

        const routes = await importProductionRoutes(getStoreStub);

        const response = await routes.DELETE(createContext('DELETE', JSON.stringify({ id: SENTINEL_ID })));

        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(200);
        expect(result.deleted).toBe(true);
        expect(getStoreStub).toHaveBeenCalledWith({ consistency: 'strong', name: 'testimonials' });
        expect(store.delete).toHaveBeenCalledExactlyOnceWith(SENTINEL_ID);
    });

    test('lists blob-backed testimonials through the loader', async () => {
        const store = buildBlobStore({
            'first-client': { industry: 'Technology', name: 'Ada', quote: 'Excellent.', role: 'CTO' },
            'second-client': { industry: 'Finance', name: 'Lin', quote: 'Superb.', role: 'Director' },
        });

        const routes = await importProductionRoutes(() => store);

        const response = await routes.GET(createContext('GET'));

        const testimonials: Record<string, unknown>[] = await response.json();

        expect(response.status).toBe(200);
        expect(testimonials.map(entry => entry.id)).toEqual(['first-client', 'second-client']);
        expect(store.list).toHaveBeenCalledTimes(1);
        expect(store.get).toHaveBeenCalledWith('first-client', { type: 'json' });
        expect(store.get).toHaveBeenCalledWith('second-client', { type: 'json' });
    });
});
