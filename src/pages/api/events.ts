import { getStore } from '@netlify/blobs';

import { deleteEntry, readCollection, writeEntry } from '@lib/local';
import { getEvents } from '@lib/store';
import { verifyAuth } from '@lib/authServer';

import type { APIRoute } from 'astro';

const DEV = import.meta.env.DEV;

async function loadEvents(): Promise<Record<string, unknown>[]> {
    if (DEV) return readCollection('events');

    return getEvents();
}

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
    if (!await verifyAuth(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let id: string;

    try {
        ({ id } = await request.json());
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

    if (DEV) {
        deleteEntry('events', id);
    } else {
        await getStore({ consistency: 'strong', name: 'events' }).delete(String(id));
    }

    return Response.json({ deleted: true });
};

export const GET: APIRoute = async () => {
    const events = await loadEvents();

    events.sort((entryA, entryB) => String(entryB.date ?? '').localeCompare(String(entryA.date ?? '')));

    return Response.json(events, {
        headers: { 'Cache-Control': 'no-store' },
    });
};

export const POST: APIRoute = async ({ request }) => {
    if (!await verifyAuth(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: Record<string, unknown>;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const date = String(body.date || '');

    if (!date) return Response.json({ error: 'Date is required' }, { status: 400 });

    if (body.cover && !/^https?:\/\/.+/.test(String(body.cover))) return Response.json({ error: 'Invalid cover URL' }, { status: 400 });

    const previousId = body.id ? String(body.id) : null;
    const id = date;

    const events = await loadEvents();

    if (previousId && previousId !== id) {
        if (events.find(entry => String(entry.date) === date && String(entry.id) !== previousId)) {
            return Response.json({ error: 'An event already exists on this date' }, { status: 409 });
        }

        if (DEV) {
            deleteEntry('events', previousId);
        } else {
            await getStore({ consistency: 'strong', name: 'events' }).delete(previousId);
        }
    } else if (!previousId && events.find(entry => String(entry.date) === date)) {
        return Response.json({ error: 'An event already exists on this date' }, { status: 409 });
    }

    const data: Record<string, string> = {
        content: String(body.content || ''),
        date,
        location: String(body.location || ''),
        title: String(body.title || ''),
    };

    if (body.cover) data.cover = String(body.cover);
    if (body.level) data.level = String(body.level);

    if (DEV) {
        writeEntry('events', id, data);
    } else {
        await getStore({ consistency: 'strong', name: 'events' }).setJSON(id, data);
    }

    return Response.json({ id, ...data });
};
