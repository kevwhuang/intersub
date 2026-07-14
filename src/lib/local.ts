import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CONTENT_DIR } from '@lib/constants';

const SAFE_ID_PATTERN = /^[\w-]+$/;

const contentRoot = join(process.cwd(), CONTENT_DIR);

export function deleteEntry(collection: string, id: string) {
    if (!SAFE_ID_PATTERN.test(id)) throw new Error(`Invalid id: ${id}`);

    const filepath = join(contentRoot, collection, `${id}.json`);

    if (existsSync(filepath)) unlinkSync(filepath);
}

export function readCollection<Entry = Record<string, unknown>>(collection: string): Entry[] {
    const directory = join(contentRoot, collection);

    if (!existsSync(directory)) return [];

    return readdirSync(directory)
        .filter(file => file.endsWith('.json'))
        .map((file) => {
            const content = JSON.parse(readFileSync(join(directory, file), 'utf-8'));

            return { id: file.replace('.json', ''), ...content };
        });
}

export function writeEntry(collection: string, id: string, data: Record<string, unknown>) {
    if (!SAFE_ID_PATTERN.test(id)) throw new Error(`Invalid id: ${id}`);

    const directory = join(contentRoot, collection);
    const entry = { ...data };

    delete entry.id;

    const json = JSON.stringify(entry, Object.keys(entry).sort(), 4);

    writeFileSync(join(directory, `${id}.json`), json);
}
