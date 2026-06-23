import type { APIRoute } from 'astro';

import { getCollection } from 'astro:content';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
    const { id } = await request.json();

    if (!id) {
        return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    const store = getStore('seminars');

    await store.delete(String(id));

    return Response.json({ deleted: true });
};

export const GET: APIRoute = async () => {
    try {
        const store = getStore('seminars');
        const { blobs } = await store.list();

        if (blobs.length > 0) {
            const seminars = await Promise.all(
                blobs.map(async (blob) => {
                    const data = await store.get(blob.key, { type: 'json' });
                    return { id: blob.key, ...data };
                }),
            );

            seminars.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            return new Response(JSON.stringify(seminars), {
                headers: { 'content-type': 'application/json' },
            });
        }
    } catch {
        return Response.json([]);
    }

    const entries = await getCollection('seminars');

    const seminars = entries
        .sort((a, b) => b.data.date.localeCompare(a.data.date))
        .map(entry => ({
            id: entry.id,
            ...entry.data,
        }));

    return new Response(JSON.stringify(seminars), {
        headers: { 'content-type': 'application/json' },
    });
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const store = getStore('seminars');

    let id = body.id ? String(body.id) : null;

    if (!id) {
        const { blobs } = await store.list();
        const maxId = blobs.reduce((max, blob) => {
            const num = parseInt(blob.key, 10);
            return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        id = String(maxId + 1);
    }

    const data: Record<string, string> = {
        content: body.content || '',
        date: body.date || '',
        location: body.location || '',
        title: body.title || '',
    };

    if (body.cover) data.cover = body.cover;
    if (body.difficulty) data.difficulty = body.difficulty;

    await store.setJSON(id, data);

    return Response.json({ id, ...data });
};
