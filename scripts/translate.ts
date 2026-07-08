import { join } from 'node:path';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { CONTENT_DIR } from '../src/lib/constants';

interface FieldConfig {
    isArray: boolean;
    name: string;
}

const FIELD_CONFIGS: Record<string, FieldConfig[]> = {
    events: [
        { isArray: false, name: 'title' },
    ],
    outcomes: [
        { isArray: true, name: 'points' },
        { isArray: false, name: 'summary' },
        { isArray: false, name: 'title' },
    ],
    testimonials: [
        { isArray: false, name: 'industry' },
        { isArray: false, name: 'name' },
        { isArray: false, name: 'quote' },
        { isArray: false, name: 'role' },
    ],
};

const contentRoot = join(import.meta.dir, '..', CONTENT_DIR);

const translationsRoot = join(contentRoot, 'translations');

function scaffoldCollection(collection: string, fields: FieldConfig[]) {
    const contentDirectory = join(contentRoot, collection);
    const translationPath = join(translationsRoot, `${collection}.json`);

    const entries: Record<string, Record<string, string | string[]>> = JSON.parse(readFileSync(translationPath, 'utf-8'));
    const files = readdirSync(contentDirectory).filter(file => file.endsWith('.json'));

    for (const file of files) {
        const content: Record<string, unknown> = JSON.parse(readFileSync(join(contentDirectory, file), 'utf-8'));
        const id = file.replace('.json', '');

        if (!entries[id]) entries[id] = {};

        for (const field of fields) {
            if (field.name in entries[id]) continue;

            entries[id][field.name] = field.isArray && Array.isArray(content[field.name])
                ? (content[field.name] as unknown[]).map(() => '')
                : '';
        }
    }

    for (const id of Object.keys(entries)) {
        if (!files.includes(`${id}.json`)) delete entries[id];
    }

    const sortedEntries = Object.fromEntries(Object.entries(entries).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));

    writeFileSync(translationPath, JSON.stringify(sortedEntries, null, 4));
}

for (const [collection, fields] of Object.entries(FIELD_CONFIGS)) {
    scaffoldCollection(collection, fields);
}
