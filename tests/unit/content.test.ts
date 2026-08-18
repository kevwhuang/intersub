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
const eventParser = collections.events.schema as SchemaParser;
const events = loadCollection('events');
const outcomeParser = collections.outcomes.schema as SchemaParser;
const outcomes = loadCollection('outcomes');
const srcRoot = join(process.cwd(), 'src');
const testimonialParser = collections.testimonials.schema as SchemaParser;
const testimonials = loadCollection('testimonials');
const translations = loadCollection('translations');

const allEntries = [...events, ...outcomes, ...testimonials, ...translations];

function buildEvent(overrides: Record<string, unknown> = {}) {
    return {
        content: 'A hands-on session on workplace negotiation.',
        cover: '/images/events/2026_06_15.webp',
        date: '2026-06-15',
        level: LEVELS[0],
        location: 'Online',
        time: '19:00-21:00',
        title: 'Negotiation Workshop',
        ...overrides,
    };
}

function buildOutcome(overrides: Record<string, unknown> = {}) {
    return {
        points: ['Led a quarterly review in English.'],
        summary: 'From silent meetings to leading them.',
        title: 'Finance Director',
        ...overrides,
    };
}

function buildTestimonial(overrides: Record<string, unknown> = {}) {
    return {
        industry: 'Technology',
        name: 'Ada',
        quote: 'The coaching changed how I run meetings.',
        role: 'CTO',
        ...overrides,
    };
}

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
            expect(stem).toBe(String(data.date).replaceAll('-', '_'));
            expect(data.date).toMatch(DATE_PATTERN);
        }
    });

    test('time matches the shared time pattern', () => {
        for (const { data, name } of events) {
            expect(String(data.time), `${name} time`).toMatch(TIME_PATTERN);
        }
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

    test('every event image is referenced by an event cover', () => {
        const covers = new Set(events.map(({ data }) => String(data.cover ?? '')));
        const imageFiles = readdirSync(join(srcRoot, 'images/events'));

        expect(imageFiles.length).toBeGreaterThan(0);

        for (const file of imageFiles) {
            expect(covers.has(`/images/events/${file}`), file).toBe(true);
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
        for (const { stem } of outcomes) {
            expect(stem).toMatch(ID_PATTERN);
        }
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
        for (const { data, stem } of testimonials) {
            expect(stem).toBe(`${data.name}-${data.role}`.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''));
        }
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

    test('accepts the crafted event, outcome, and testimonial baselines', () => {
        expect(eventParser.safeParse(buildEvent()).success).toBe(true);
        expect(outcomeParser.safeParse(buildOutcome()).success).toBe(true);
        expect(testimonialParser.safeParse(buildTestimonial()).success).toBe(true);
    });

    test('rejects an event missing its date', () => {
        expect(eventParser.safeParse(buildEvent({ date: undefined })).success).toBe(false);
    });

    test('rejects an event with a non-string time', () => {
        expect(eventParser.safeParse(buildEvent({ time: 1_900 })).success).toBe(false);
    });

    test('rejects an event with an unknown level', () => {
        expect(eventParser.safeParse(buildEvent({ level: 'Expert' })).success).toBe(false);
    });

    test('rejects an outcome with an empty points array', () => {
        expect(outcomeParser.safeParse(buildOutcome({ points: [] })).success).toBe(false);
    });

    test('rejects an outcome with a non-string point', () => {
        expect(outcomeParser.safeParse(buildOutcome({ points: [42] })).success).toBe(false);
    });

    test('rejects a testimonial missing its role', () => {
        expect(testimonialParser.safeParse(buildTestimonial({ role: undefined })).success).toBe(false);
    });

    test('rejects a testimonial with a non-string quote', () => {
        expect(testimonialParser.safeParse(buildTestimonial({ quote: 7 })).success).toBe(false);
    });
});

describe('json files', () => {
    test('files end without a trailing newline', () => {
        for (const { name, raw } of allEntries) {
            expect(raw.endsWith('\n'), name).toBe(false);
        }
    });

    test('files contain no curly apostrophes', () => {
        for (const { name, raw } of allEntries) {
            expect(CURLY_APOSTROPHE_PATTERN.test(raw), name).toBe(false);
        }
    });
});
