import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

import { slugify } from '../src/lib/utils';

const BASE_URL = process.argv[2] || 'https://intersubstudio.com';
const COLLECTIONS = ['outcomes', 'events', 'testimonials'] as const;
const CONTENT_DIR = join(import.meta.dir, '..', 'src', 'content');

async function fetchCollection(endpoint: string): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${BASE_URL}/api/${endpoint}`);

    if (!response.ok) {
        throw new Error(`${endpoint}: ${response.status} ${response.statusText}`);
    }

    const data: Record<string, unknown>[] = await response.json();

    if (!data.length) {
        throw new Error(`${endpoint}: empty response`);
    }

    return data;
}

function writeCollection(directory: string, items: Record<string, unknown>[]) {
    const outputDirectory = join(CONTENT_DIR, directory);

    rmSync(outputDirectory, { force: true, recursive: true });
    mkdirSync(outputDirectory, { recursive: true });

    for (let index = 0; index < items.length; index++) {
        const entry = { ...items[index] };

        delete entry.id;

        let filename = `${index + 1}.json`;

        if (directory === 'events' && entry.date) {
            filename = `${entry.date}.json`;
        } else if (directory === 'testimonials' && entry.name && entry.role) {
            filename = `${slugify(String(entry.name))}-${slugify(String(entry.role))}.json`;
        }

        const json = JSON.stringify(entry, Object.keys(entry).sort(), 4);

        writeFileSync(join(outputDirectory, filename), json);
    }
}

for (const collection of COLLECTIONS) {
    const data = await fetchCollection(collection);

    writeCollection(collection, data);
}
