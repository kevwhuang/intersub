import { getStore } from '@netlify/blobs';

import { getSeminars } from '@lib/store';
import { verifyAuth } from '@lib/auth-server';

import type { APIRoute } from 'astro';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
    if (!await verifyAuth(request)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let id: string;

    try {
        ({ id } = await request.json());
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!id) {
        return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    const store = getStore('seminars');

    await store.delete(String(id));

    return Response.json({ deleted: true });
};

export const GET: APIRoute = async () => {
    const seminars = await getSeminars();

    return Response.json(seminars, {
        headers: { 'Cache-Control': 'no-store' },
    });
};

export const POST: APIRoute = async ({ request }) => {
    if (!await verifyAuth(request)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const store = getStore('seminars');
    const date = body.date || '';

    if (!date) {
        return Response.json({ error: 'Date is required' }, { status: 400 });
    }

    const previousId = body.id ? String(body.id) : null;
    const id = date;

    if (previousId && previousId !== id) {
        const seminars = await getSeminars();
        const conflict = seminars.find(s => String(s.date) === date && String(s.id) !== previousId);

        if (conflict) {
            return Response.json({ error: 'A seminar already exists on this date' }, { status: 409 });
        }

        await store.delete(previousId);
    } else if (!previousId) {
        const seminars = await getSeminars();
        const conflict = seminars.find(s => String(s.date) === date);

        if (conflict) {
            return Response.json({ error: 'A seminar already exists on this date' }, { status: 409 });
        }
    }

    const data: Record<string, string> = {
        content: body.content || '',
        date,
        location: body.location || '',
        title: body.title || '',
    };

    if (body.cover) data.cover = body.cover;
    if (body.difficulty) data.difficulty = body.difficulty;

    await store.setJSON(id, data);

    return Response.json({ id, ...data });
};
