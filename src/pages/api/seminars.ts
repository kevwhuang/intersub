import { getStore } from '@netlify/blobs';

import { deleteEntry, readCollection, writeEntry } from '@lib/local';
import { getSeminars } from '@lib/store';
import { verifyAuth } from '@lib/authServer';

import type { APIRoute } from 'astro';

const DEV = import.meta.env.DEV;

async function loadSeminars(): Promise<Record<string, unknown>[]> {
    if (DEV) return readCollection('seminars');

    return getSeminars();
}

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

    if (DEV) {
        deleteEntry('seminars', id);
    } else {
        await getStore({ consistency: 'strong', name: 'seminars' }).delete(String(id));
    }

    return Response.json({ deleted: true });
};

export const GET: APIRoute = async () => {
    const seminars = await loadSeminars();

    seminars.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));

    return Response.json(seminars, {
        headers: { 'Cache-Control': 'no-store' },
    });
};

export const POST: APIRoute = async ({ request }) => {
    if (!await verifyAuth(request)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const date = body.date || '';

    if (!date) {
        return Response.json({ error: 'Date is required' }, { status: 400 });
    }

    if (body.cover && !/^https?:\/\/.+/.test(body.cover)) {
        return Response.json({ error: 'Invalid cover URL' }, { status: 400 });
    }

    const previousId = body.id ? String(body.id) : null;
    const id = date;
    const seminars = await loadSeminars();

    if (previousId && previousId !== id) {
        if (seminars.find(s => String(s.date) === date && String(s.id) !== previousId)) {
            return Response.json({ error: 'A seminar already exists on this date' }, { status: 409 });
        }

        if (DEV) {
            deleteEntry('seminars', previousId);
        } else {
            await getStore({ consistency: 'strong', name: 'seminars' }).delete(previousId);
        }
    } else if (!previousId && seminars.find(s => String(s.date) === date)) {
        return Response.json({ error: 'A seminar already exists on this date' }, { status: 409 });
    }

    const data: Record<string, string> = {
        content: body.content || '',
        date,
        location: body.location || '',
        title: body.title || '',
    };

    if (body.cover) data.cover = body.cover;
    if (body.difficulty) data.difficulty = body.difficulty;

    if (DEV) {
        writeEntry('seminars', id, data);
    } else {
        await getStore({ consistency: 'strong', name: 'seminars' }).setJSON(id, data);
    }

    return Response.json({ id, ...data });
};
