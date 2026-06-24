import type { APIRoute } from 'astro';

import { getStore } from '@netlify/blobs';
import { getSeminars } from '@lib/store';

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
    const seminars = await getSeminars();

    return Response.json(seminars);
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const store = getStore('seminars');

    let id = body.id ? String(body.id) : null;

    if (!id) {
        const seminars = await getSeminars();
        const maxId = seminars.reduce((max, entry) => {
            const num = parseInt(String(entry.id), 10);
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
