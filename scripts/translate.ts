import { join } from 'node:path';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

interface FieldConfig {
    array: boolean;
    name: string;
}

const COLLECTIONS: Record<string, FieldConfig[]> = {
    outcomes: [
        { array: true, name: 'points' },
        { array: false, name: 'summary' },
        { array: false, name: 'title' },
    ],
    seminars: [
        { array: false, name: 'title' },
    ],
    testimonials: [
        { array: false, name: 'industry' },
        { array: false, name: 'name' },
        { array: false, name: 'quote' },
        { array: false, name: 'role' },
    ],
};

const CONTENT_DIR = join(import.meta.dir, '..', 'src', 'content');

const TRANSLATIONS_DIR = join(CONTENT_DIR, 'translations');

function scaffoldCollection(collection: string, fields: FieldConfig[]) {
    const contentDirectory = join(CONTENT_DIR, collection);
    const translationPath = join(TRANSLATIONS_DIR, `${collection}.json`);

    const entries: Record<string, Record<string, string | string[]>> = JSON.parse(readFileSync(translationPath, 'utf-8'));
    const files = readdirSync(contentDirectory).filter(file => file.endsWith('.json'));

    for (const file of files) {
        const content: Record<string, unknown> = JSON.parse(readFileSync(join(contentDirectory, file), 'utf-8'));
        const id = file.replace('.json', '');

        if (!entries[id]) entries[id] = {};

        for (const field of fields) {
            if (field.name in entries[id]) continue;

            entries[id][field.name] = field.array && Array.isArray(content[field.name])
                ? (content[field.name] as unknown[]).map(() => '')
                : '';
        }
    }

    for (const id of Object.keys(entries)) {
        if (!files.includes(`${id}.json`)) delete entries[id];
    }

    const sorted = Object.fromEntries(Object.entries(entries).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));

    writeFileSync(translationPath, JSON.stringify(sorted, null, 4));
}

for (const [collection, fields] of Object.entries(COLLECTIONS)) {
    scaffoldCollection(collection, fields);
}
