import { getStore } from '@netlify/blobs';
import { join, parse } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

const CONTENT_DIR = join(import.meta.dir, '..', 'src', 'content');
const SITE_ID = process.env.SITE_ID;
const STORES = ['outcomes', 'events', 'testimonials'] as const;
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

async function uploadFile(store: ReturnType<typeof getStore>, filePath: string, key: string) {
    const data = JSON.parse(await readFile(filePath, 'utf-8'));

    await store.setJSON(key, data);
}

if (SITE_ID && TOKEN) {
    for (const name of STORES) {
        const store = getStore({ name, siteID: SITE_ID, token: TOKEN });

        await store.deleteAll();

        const directory = join(CONTENT_DIR, name);

        const files = await readdir(directory);

        await Promise.all(
            files.filter(file => file.endsWith('.json')).map(file => uploadFile(store, join(directory, file), parse(file).name)),
        );
    }
}
