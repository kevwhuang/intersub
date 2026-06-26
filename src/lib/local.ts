import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

export function deleteEntry(collection: string, id: string) {
    const filepath = join(CONTENT_DIR, collection, `${id}.json`);

    if (existsSync(filepath)) unlinkSync(filepath);
}

export function readCollection(name: string): Record<string, unknown>[] {
    const directory = join(CONTENT_DIR, name);

    if (!existsSync(directory)) return [];

    return readdirSync(directory)
        .filter(file => file.endsWith('.json'))
        .map((file) => {
            const content = JSON.parse(readFileSync(join(directory, file), 'utf-8'));

            return { id: file.replace('.json', ''), ...content };
        });
}

export function writeEntry(collection: string, id: string, data: Record<string, unknown>) {
    const directory = join(CONTENT_DIR, collection);
    const entry = { ...data };

    delete entry.id;

    const json = JSON.stringify(entry, Object.keys(entry).sort(), 4);

    writeFileSync(join(directory, `${id}.json`), json);
}
