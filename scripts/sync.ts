import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

import { COLLECTIONS, CONTENT_DIR } from '../src/lib/constants';

const BASE_URL = process.argv[2] || 'https://intersubstudio.com';

const contentRoot = join(import.meta.dir, '..', CONTENT_DIR);

async function fetchCollection(collection: string): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${BASE_URL}/api/${collection}`);

    if (!response.ok) throw new Error(`${collection}: ${response.status} ${response.statusText}`);

    const data: Record<string, unknown>[] = await response.json();

    if (!data.length) throw new Error(`${collection}: empty response`);

    return data;
}

function writeCollection(collection: string, items: Record<string, unknown>[]) {
    const outputDirectory = join(contentRoot, collection);

    rmSync(outputDirectory, { force: true, recursive: true });
    mkdirSync(outputDirectory, { recursive: true });

    for (let index = 0; index < items.length; index++) {
        const entry = { ...items[index] };
        const filename = `${items[index].id ?? index + 1}.json`;

        delete entry.id;

        const json = JSON.stringify(entry, Object.keys(entry).sort(), 4);

        writeFileSync(join(outputDirectory, filename), json);
    }
}

if (process.env.NETLIFY) process.exit(0);

for (const collection of COLLECTIONS) {
    const data = await fetchCollection(collection);

    writeCollection(collection, data);
}
