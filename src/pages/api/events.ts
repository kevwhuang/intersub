import { getStore } from '@netlify/blobs';

import { IS_DEV, LEVELS, URL_PATTERN } from '@lib/constants';
import { deleteEntry, readCollection, writeEntry } from '@lib/local';
import { getEvents } from '@lib/store';
import { verifyAuth } from '@lib/authServer';

import type { APIRoute } from 'astro';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function loadEvents(): Promise<Record<string, unknown>[]> {
    if (IS_DEV) return readCollection('events');

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

    const events = await loadEvents();

    if (!events.find(entry => String(entry.id) === String(id))) return Response.json({ error: 'Event not found' }, { status: 400 });

    if (IS_DEV) {
        deleteEntry('events', id);
    } else {
        await getStore({ consistency: 'strong', name: 'events' }).setJSON(String(id), { deleted: true });
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

    if (!body || typeof body !== 'object') return Response.json({ error: 'Invalid request body' }, { status: 400 });

    const content = String(body.content || '').trim();
    const cover = String(body.cover || '').trim();
    const date = String(body.date || '');
    const level = String(body.level || '');
    const location = String(body.location || '').trim();
    const title = String(body.title || '').trim();

    if (!content) return Response.json({ error: 'Content is required' }, { status: 400 });
    if (cover && !URL_PATTERN.test(cover)) return Response.json({ error: 'Invalid cover URL' }, { status: 400 });
    if (!DATE_PATTERN.test(date)) return Response.json({ error: 'Date must be YYYY-MM-DD' }, { status: 400 });
    if (level && !LEVELS.some(entry => entry === level)) return Response.json({ error: 'Invalid level' }, { status: 400 });
    if (!location) return Response.json({ error: 'Location is required' }, { status: 400 });
    if (!title) return Response.json({ error: 'Title is required' }, { status: 400 });

    const id = date;
    const previousId = body.id ? String(body.id) : null;

    const events = await loadEvents();

    if (previousId && !events.find(entry => String(entry.id) === previousId)) return Response.json({ error: 'Event not found' }, { status: 400 });

    if (events.find(entry => String(entry.date) === date && String(entry.id) !== previousId)) return Response.json({ error: 'An event already exists on this date' }, { status: 409 });

    const data: Record<string, string> = { content, date, location, title };

    if (cover) data.cover = cover;
    if (level) data.level = level;

    if (IS_DEV) {
        writeEntry('events', id, data);
    } else {
        const store = getStore({ consistency: 'strong', name: 'events' });
        const existing = await store.get(id, { type: 'json' });

        if (existing && !existing.deleted && previousId !== id) return Response.json({ error: 'An event already exists on this date' }, { status: 409 });

        await store.setJSON(id, data);
    }

    if (previousId && previousId !== id) {
        if (IS_DEV) {
            deleteEntry('events', previousId);
        } else {
            await getStore({ consistency: 'strong', name: 'events' }).setJSON(previousId, { deleted: true });
        }
    }

    return Response.json({ id, ...data });
};
