import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const BASE_URL = process.argv[2] || 'https://intersubstudio.com';
const COLLECTIONS = ['outcomes', 'seminars', 'testimonials'] as const;
const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content');

function slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

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

        let filename = `${index + 1}.json`;

        if (directory === 'seminars' && entry.date) {
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
