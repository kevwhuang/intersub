import type { APIRoute } from 'astro';

import { getStore } from '@netlify/blobs';
import { getOutcomes } from '@lib/store';

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
    const outcomes = await getOutcomes();

    return Response.json(outcomes);
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const store = getStore('outcomes');

    let id = body.id ? String(body.id) : null;

    if (!id) {
        const outcomes = await getOutcomes();
        const maxId = outcomes.reduce((max, entry) => {
            const num = parseInt(String(entry.id), 10);
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
