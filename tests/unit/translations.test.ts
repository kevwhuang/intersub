import { describe, expect, test } from 'vitest';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

const DESCRIPTION_PROP_PATTERN = /description=(?:"([^"]*)"|\{'([^']*)'\})/g;
const ESCAPED_APOSTROPHE_PATTERN = /\\'/g;
const LITERAL_KEY_PATTERN = /data-i18n(?:-aria)?="([^"]*)"/g;
const OUTCOME_FIELDS = ['points', 'summary', 'title'] as const;
const SOURCE_EXTENSIONS = ['.astro', '.ts', '.tsx'] as const;
const TESTIMONIAL_FIELDS = ['industry', 'quote', 'role'] as const;
const TITLE_PROP_PATTERN = /title=(?:"([^"]*)"|\{'([^']*)'\})/g;
const UNICODE_ESCAPE_PATTERN = /\\u([\da-f]{4})/gi;

const contentRoot = join(process.cwd(), 'src/content');
const pagesRoot = join(process.cwd(), 'src/pages');
const srcRoot = join(process.cwd(), 'src');
const translationsRoot = join(contentRoot, 'translations');

const events = loadCollection('events');
const outcomes = loadCollection('outcomes');
const testimonials = loadCollection('testimonials');

const descriptionTranslations = loadTranslation('descriptions.json');
const outcomesTranslations = loadTranslation('outcomes.json');
const testimonialsTranslations = loadTranslation('testimonials.json');
const titleTranslations = loadTranslation('titles.json');
const translationFiles = readdirSync(translationsRoot).filter(file => file.endsWith('.json')).sort();
const uiTranslations = loadTranslation('ui.json');

const sourceFiles = walk(srcRoot);
const astroFiles = sourceFiles.filter(file => file.endsWith('.astro'));
const sourceText = normalize(sourceFiles.map(file => readFileSync(file, 'utf-8')).join('\n'));

const adminPage = join(pagesRoot, 'admin.astro');
const pageFiles = astroFiles.filter(file => file.startsWith(pagesRoot));
const publicPages = pageFiles.filter(file => file !== adminPage);

const pageDescriptions = extractLayoutProps(publicPages, DESCRIPTION_PROP_PATTERN);
const pageTitles = extractLayoutProps(publicPages, TITLE_PROP_PATTERN);

function collectStrings(entry: Record<string, unknown>, fields: readonly string[]) {
    return fields.flatMap((field) => {
        const value = entry[field];

        return Array.isArray(value) ? value.map(String) : [String(value)];
    });
}

function extractLayoutProps(files: string[], pattern: RegExp) {
    return files.flatMap((file) => {
        const text = normalize(readFileSync(file, 'utf-8'));

        return [...text.matchAll(pattern)].map(match => match[1] ?? match[2]);
    });
}

function loadCollection(collection: string) {
    const directory = join(contentRoot, collection);

    return readdirSync(directory)
        .filter(file => file.endsWith('.json'))
        .sort()
        .map(file => JSON.parse(readFileSync(join(directory, file), 'utf-8')) as Record<string, unknown>);
}

function loadTranslation(file: string) {
    return JSON.parse(readFileSync(join(translationsRoot, file), 'utf-8')) as Record<string, string>;
}

function normalize(text: string) {
    return text
        .replace(UNICODE_ESCAPE_PATTERN, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
        .replace(ESCAPED_APOSTROPHE_PATTERN, '\'');
}

function walk(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) return walk(path);

        return SOURCE_EXTENSIONS.some(extension => entry.name.endsWith(extension)) ? [path] : [];
    });
}

describe('files', () => {
    test('every file parses as a flat string map', () => {
        expect(translationFiles.length).toBeGreaterThan(0);

        for (const file of translationFiles) {
            const parsed = loadTranslation(file);

            for (const value of Object.values(parsed)) expect(typeof value, file).toBe('string');
        }
    });

    test('keys are ascii alphabetized', () => {
        for (const file of translationFiles) {
            const keys = Object.keys(loadTranslation(file));

            expect(keys, file).toEqual([...keys].sort());
        }
    });

    test('files end without a trailing newline', () => {
        for (const file of translationFiles) {
            const raw = readFileSync(join(translationsRoot, file), 'utf-8');

            expect(raw.endsWith('\n'), file).toBe(false);
        }
    });
});

describe('descriptions', () => {
    test('every public page description has a translation', () => {
        expect(pageDescriptions.length).toBeGreaterThan(0);

        for (const description of pageDescriptions) {
            expect(description in descriptionTranslations, `missing: ${description}`).toBe(true);
        }
    });

    test('every key matches a public page description', () => {
        for (const key of Object.keys(descriptionTranslations)) {
            expect(pageDescriptions.includes(key), `orphaned: ${key}`).toBe(true);
        }
    });

    test('the admin page description stays untranslated by design', () => {
        const adminDescriptions = extractLayoutProps([adminPage], DESCRIPTION_PROP_PATTERN);

        expect(adminDescriptions.length).toBe(1);
        expect(adminDescriptions[0] in descriptionTranslations).toBe(false);
    });
});

describe('outcomes', () => {
    test('every title, summary, and point has a translation', () => {
        expect(outcomes.length).toBeGreaterThan(0);

        for (const outcome of outcomes) {
            for (const value of collectStrings(outcome, OUTCOME_FIELDS)) {
                expect(value in outcomesTranslations, `missing: ${value}`).toBe(true);
            }
        }
    });
});

describe('testimonials', () => {
    test('every industry, quote, and role has a translation', () => {
        expect(testimonials.length).toBeGreaterThan(0);

        for (const testimonial of testimonials) {
            for (const value of collectStrings(testimonial, TESTIMONIAL_FIELDS)) {
                expect(value in testimonialsTranslations, `missing: ${value}`).toBe(true);
            }
        }
    });
});

describe('titles', () => {
    test('every public page title has a translation', () => {
        expect(pageTitles.length).toBeGreaterThan(0);

        for (const title of pageTitles) {
            expect(title in titleTranslations, `missing: ${title}`).toBe(true);
        }
    });

    test('every key matches a public page or event detail title', () => {
        const expected = new Set(pageTitles);

        for (const key of Object.keys(titleTranslations)) {
            expect(expected.has(key), `orphaned: ${key}`).toBe(true);
        }
    });

    test('the admin page title stays untranslated by design', () => {
        const adminTitles = extractLayoutProps([adminPage], TITLE_PROP_PATTERN);

        expect(adminTitles.length).toBe(1);
        expect(adminTitles[0] in titleTranslations).toBe(false);
    });
});

describe('ui', () => {
    test('every literal data-i18n key has a translation', () => {
        const keys = new Set<string>();

        for (const file of astroFiles) {
            for (const match of readFileSync(file, 'utf-8').matchAll(LITERAL_KEY_PATTERN)) keys.add(match[1]);
        }

        expect(keys.size).toBeGreaterThan(0);

        for (const key of keys) expect(key in uiTranslations, `missing: ${key}`).toBe(true);
    });

    test('every key is used in source or bound content values', () => {
        const boundValues = new Set(events.flatMap(event => [String(event.level || ''), String(event.location)]));

        for (const key of Object.keys(uiTranslations)) {
            const used = boundValues.has(key)
                || sourceText.includes(`"${key}"`)
                || sourceText.includes(`'${key}'`);

            expect(used, `orphaned: ${key}`).toBe(true);
        }
    });
});
