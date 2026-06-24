import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.argv[2] || 'https://intersubstudio.com';
const COLLECTIONS = ['outcomes', 'seminars'] as const;
const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content');

async function fetchCollection(endpoint: string): Promise<Record<string, unknown>[]> {
    const response = await fetch(`${BASE_URL}/api/${endpoint}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
    }

    const data: Record<string, unknown>[] = await response.json();

    if (!data.length) {
        throw new Error(`Failed to fetch ${endpoint}: empty response, aborting to prevent data loss`);
    }

    return data;
}

function writeCollection(directory: string, items: Record<string, unknown>[]) {
    const outputDirectory = join(CONTENT_DIR, directory);

    if (existsSync(outputDirectory)) {
        rmSync(outputDirectory, { recursive: true });
    }

    mkdirSync(outputDirectory, { recursive: true });

    for (let index = 0; index < items.length; index++) {
        const entry = { ...items[index] };

        delete entry.id;

        const filename = `${index + 1}.json`;
        const json = JSON.stringify(entry, Object.keys(entry).sort(), 4);

        writeFileSync(join(outputDirectory, filename), json + '\n');
    }
}

for (const collection of COLLECTIONS) {
    const data = await fetchCollection(collection);

    writeCollection(collection, data);
}
