import { join } from 'node:path';
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

export function readCollection(name: string): Record<string, unknown>[] {
    const dir = join(CONTENT_DIR, name);

    if (!existsSync(dir)) return [];

    return readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map((f) => {
            const data = JSON.parse(readFileSync(join(dir, f), 'utf-8'));

            return { id: f.replace('.json', ''), ...data };
        });
}

export function writeEntry(collection: string, id: string, data: Record<string, unknown>) {
    const dir = join(CONTENT_DIR, collection);
    const entry = { ...data };

    delete entry.id;

    const json = JSON.stringify(entry, Object.keys(entry).sort(), 4);

    writeFileSync(join(dir, `${id}.json`), json);
}

export function deleteEntry(collection: string, id: string) {
    const filepath = join(CONTENT_DIR, collection, `${id}.json`);

    if (existsSync(filepath)) unlinkSync(filepath);
}
