import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { COVER_PATH_PATTERN, LEVELS, TIME_PATTERN, URL_PATTERN } from '../../src/lib/constants';
import { collections } from '../../src/content.config';

interface Entry {
    data: Record<string, unknown>;
    name: string;
    raw: string;
    stem: string;
}

interface SchemaParser {
    safeParse: (data: unknown) => { error?: { message: string }; success: boolean };
}

const CURLY_APOSTROPHE_PATTERN = /[\u2018\u2019]/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_FIELDS = ['content', 'date', 'location', 'time', 'title'] as const;
const ID_PATTERN = /^\d+$/;
const OUTCOME_FIELDS = ['summary', 'title'] as const;
const TESTIMONIAL_FIELDS = ['industry', 'name', 'quote', 'role'] as const;

const contentRoot = join(process.cwd(), 'src/content');
const srcRoot = join(process.cwd(), 'src');

const events = loadCollection('events');
const outcomes = loadCollection('outcomes');
const testimonials = loadCollection('testimonials');
const translations = loadCollection('translations');

const allEntries = [...events, ...outcomes, ...testimonials, ...translations];

function expectSchemaSuccess(entries: Entry[], schema: unknown) {
    const parser = schema as SchemaParser;

    expect(typeof parser.safeParse).toBe('function');

    for (const { data, name } of entries) {
        const result = parser.safeParse(data);

        expect(result.success, `${name}${result.error ? ` ${result.error.message}` : ''}`).toBe(true);
    }
}

function loadCollection(collection: string) {
    const directory = join(contentRoot, collection);

    return readdirSync(directory)
        .filter(file => file.endsWith('.json'))
        .sort()
        .map((file) => {
            const raw = readFileSync(join(directory, file), 'utf-8');

            return {
                data: JSON.parse(raw) as Record<string, unknown>,
                name: `${collection}/${file}`,
                raw,
                stem: file.replace('.json', ''),
            };
        });
}

describe('events', () => {
    test('every entry has required non-empty string fields', () => {
        expect(events.length).toBeGreaterThan(0);

        for (const { data, name } of events) {
            for (const field of EVENT_FIELDS) {
                expect(typeof data[field], `${name} ${field}`).toBe('string');
                expect(String(data[field]).trim(), `${name} ${field}`).not.toBe('');
            }
        }
    });

    test('date matches the filename stem and YYYY-MM-DD', () => {
        for (const { data, stem } of events) {
            expect(data.date).toBe(stem);
            expect(stem).toMatch(DATE_PATTERN);
        }
    });

    test('time matches the shared time pattern', () => {
        for (const { data, name } of events) expect(String(data.time), `${name} time`).toMatch(TIME_PATTERN);
    });

    test('optional level is a known level', () => {
        for (const { data, name } of events) {
            if (!('level' in data)) continue;

            expect(LEVELS, `${name} level`).toContain(data.level);
        }
    });

    test('optional cover is an internal path or a url', () => {
        for (const { data, name } of events) {
            if (!('cover' in data)) continue;

            const cover = String(data.cover);

            const isExternal = URL_PATTERN.test(cover);
            const isInternal = COVER_PATH_PATTERN.test(cover);

            expect(isExternal || isInternal, `${name} cover`).toBe(true);

            if (isInternal) expect(existsSync(join(srcRoot, cover)), `${name} cover file`).toBe(true);
        }
    });
});

describe('outcomes', () => {
    test('points are non-empty string arrays', () => {
        expect(outcomes.length).toBeGreaterThan(0);

        for (const { data, name } of outcomes) {
            expect(Array.isArray(data.points), `${name} points`).toBe(true);

            const points = data.points as unknown[];

            expect(points.length, `${name} points`).toBeGreaterThan(0);

            for (const point of points) {
                expect(typeof point, `${name} point`).toBe('string');
                expect(String(point).trim(), `${name} point`).not.toBe('');
            }
        }
    });

    test('summary and title are non-empty strings', () => {
        for (const { data, name } of outcomes) {
            for (const field of OUTCOME_FIELDS) {
                expect(typeof data[field], `${name} ${field}`).toBe('string');
                expect(String(data[field]).trim(), `${name} ${field}`).not.toBe('');
            }
        }
    });

    test('ids are numeric', () => {
        for (const { stem } of outcomes) expect(stem).toMatch(ID_PATTERN);
    });
});

describe('testimonials', () => {
    test('industry, name, quote, and role are non-empty strings', () => {
        expect(testimonials.length).toBeGreaterThan(0);

        for (const { data, name } of testimonials) {
            for (const field of TESTIMONIAL_FIELDS) {
                expect(typeof data[field], `${name} ${field}`).toBe('string');
                expect(String(data[field]).trim(), `${name} ${field}`).not.toBe('');
            }
        }
    });

    test('id equals the slugified name and role', () => {
        for (const { data, stem } of testimonials) expect(stem).toBe(`${data.name}-${data.role}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    });
});

describe('schemas', () => {
    test('every events file parses against the events collection schema', () => {
        expectSchemaSuccess(events, collections.events.schema);
    });

    test('every outcomes file parses against the outcomes collection schema', () => {
        expectSchemaSuccess(outcomes, collections.outcomes.schema);
    });

    test('every testimonials file parses against the testimonials collection schema', () => {
        expectSchemaSuccess(testimonials, collections.testimonials.schema);
    });
});

describe('json files', () => {
    test('files end without a trailing newline', () => {
        for (const { name, raw } of allEntries) expect(raw.endsWith('\n'), name).toBe(false);
    });

    test('keys contain no curly apostrophes', () => {
        for (const { data, name } of allEntries) {
            for (const key of Object.keys(data)) {
                expect(CURLY_APOSTROPHE_PATTERN.test(key), `${name} ${key}`).toBe(false);
            }
        }
    });
});
