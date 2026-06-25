import { getStore } from '@netlify/blobs';

import { deleteEntry, readCollection, writeEntry } from '@lib/content-fs';
import { getOutcomes } from '@lib/store';
import { verifyAuth } from '@lib/auth-server';

import type { APIRoute } from 'astro';

const DEV = import.meta.env.DEV;

async function loadOutcomes(): Promise<Record<string, unknown>[]> {
    if (DEV) return readCollection('outcomes');

    return getOutcomes();
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
        deleteEntry('outcomes', id);
    } else {
        await getStore('outcomes').delete(String(id));
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
    if (!await verifyAuth(request)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    let id = body.id ? String(body.id) : null;

    if (!id) {
        const outcomes = await loadOutcomes();
        const maxId = outcomes.reduce((max, entry) => {
            const num = parseInt(String(entry.id), 10);
            return Number.isNaN(num) ? max : Math.max(max, num);
        }, 0);
        id = String(maxId + 1);
    }

    const data: Record<string, string | string[]> = {
        points: Array.isArray(body.points) ? body.points : [],
        summary: body.summary || '',
        title: body.title || '',
    };

    if (DEV) {
        writeEntry('outcomes', id, data);
    } else {
        await getStore('outcomes').setJSON(id, data);
    }

    return Response.json({ id, ...data });
};
