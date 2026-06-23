import type { APIRoute } from 'astro';

import { getCollection } from 'astro:content';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
    const { id } = await request.json();

    if (!id) {
        return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    const store = getStore('outcomes');

    await store.delete(String(id));

    return Response.json({ deleted: true });
};

export const GET: APIRoute = async () => {
    try {
        const store = getStore('outcomes');
        const { blobs } = await store.list();

        if (blobs.length > 0) {
            const outcomes = await Promise.all(
                blobs.map(async (blob) => {
                    const data = await store.get(blob.key, { type: 'json' });
                    return { id: blob.key, ...data };
                }),
            );

            return new Response(JSON.stringify(outcomes), {
                headers: { 'content-type': 'application/json' },
            });
        }
    } catch {
        return Response.json([]);
    }

    const entries = await getCollection('outcomes');

    const outcomes = entries.map(entry => ({
        id: entry.id,
        ...entry.data,
    }));

    return new Response(JSON.stringify(outcomes), {
        headers: { 'content-type': 'application/json' },
    });
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const store = getStore('outcomes');

    let id = body.id ? String(body.id) : null;

    if (!id) {
        const { blobs } = await store.list();
        const maxId = blobs.reduce((max, blob) => {
            const num = parseInt(blob.key, 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        id = String(maxId + 1);
    }

    const data: Record<string, string | string[]> = {
        points: Array.isArray(body.points) ? body.points : [],
        summary: body.summary || '',
        title: body.title || '',
    };

    await store.setJSON(id, data);

    return Response.json({ id, ...data });
};
