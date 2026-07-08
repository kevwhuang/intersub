import { getStore } from '@netlify/blobs';
import { join, parse } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';

import { COLLECTIONS, CONTENT_DIR } from '../src/lib/constants';

const SITE_ID = process.env.SITE_ID;
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

const contentRoot = join(import.meta.dir, '..', CONTENT_DIR);

async function uploadFile(store: ReturnType<typeof getStore>, filePath: string, key: string) {
    const data = JSON.parse(await readFile(filePath, 'utf-8'));

    await store.setJSON(key, data);
}

if (!process.env.NETLIFY) process.exit(0);

if (SITE_ID && TOKEN) {
    for (const name of COLLECTIONS) {
        const store = getStore({ name, siteID: SITE_ID, token: TOKEN });

        await store.deleteAll();

        const directory = join(contentRoot, name);

        const files = await readdir(directory);

        await Promise.all(
            files.filter(file => file.endsWith('.json')).map(file => uploadFile(store, join(directory, file), parse(file).name)),
        );
    }
}
