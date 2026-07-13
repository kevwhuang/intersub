import { getStore } from '@netlify/blobs';

import { IS_DEV } from '@lib/constants';
import { compareByNumericId, getOutcomes } from '@lib/store';
import { deleteEntry, readCollection, writeEntry } from '@lib/local';
import { verifyAuth } from '@lib/authServer';

import type { APIRoute } from 'astro';

async function loadOutcomes(): Promise<Record<string, unknown>[]> {
    if (IS_DEV) return readCollection('outcomes').sort(compareByNumericId);

    return getOutcomes();
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

    const outcomes = await loadOutcomes();

    if (!outcomes.find(entry => String(entry.id) === String(id))) {
        return Response.json({ error: 'Outcome not found' }, { status: 404 });
    }

    if (IS_DEV) {
        deleteEntry('outcomes', id);
    } else {
        await getStore({ consistency: 'strong', name: 'outcomes' }).delete(String(id));
    }

    return Response.json({ deleted: true });
};

export const GET: APIRoute = async () => {
    const outcomes = await loadOutcomes();

    return Response.json(outcomes, {
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

    const points = Array.isArray(body.points) ? body.points.map(entry => String(entry).trim()).filter(Boolean) : [];
    const summary = String(body.summary || '').trim();
    const title = String(body.title || '').trim();

    if (!points.length) return Response.json({ error: 'At least one outcome is required' }, { status: 400 });
    if (!summary) return Response.json({ error: 'Summary is required' }, { status: 400 });
    if (!title) return Response.json({ error: 'Title is required' }, { status: 400 });

    let id = body.id ? String(body.id) : null;

    const outcomes = await loadOutcomes();

    if (id && !outcomes.find(entry => String(entry.id) === id)) {
        return Response.json({ error: 'Outcome not found' }, { status: 404 });
    }

    if (!id) {
        const maxId = outcomes.reduce((max, entry) => {
            const parsedId = parseInt(String(entry.id), 10);

            return Number.isNaN(parsedId) ? max : Math.max(max, parsedId);
        }, 0);

        id = String(maxId + 1);
    }

    const data: Record<string, string | string[]> = { points, summary, title };

    if (IS_DEV) {
        writeEntry('outcomes', id, data);
    } else {
        await getStore({ consistency: 'strong', name: 'outcomes' }).setJSON(id, data);
    }

    return Response.json({ id, ...data });
};
