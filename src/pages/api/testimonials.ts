import { getStore } from '@netlify/blobs';

import { deleteEntry, readCollection, writeEntry } from '@lib/local';
import { getTestimonials } from '@lib/store';
import { slugify } from '@lib/utils';
import { verifyAuth } from '@lib/authServer';

import type { APIRoute } from 'astro';

const DEV = import.meta.env.DEV;

async function loadTestimonials(): Promise<Record<string, unknown>[]> {
    if (DEV) return readCollection('testimonials');

    return getTestimonials();
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
        deleteEntry('testimonials', id);
    } else {
        await getStore({ consistency: 'strong', name: 'testimonials' }).delete(String(id));
    }

    return Response.json({ deleted: true });
};

export const GET: APIRoute = async () => {
    const testimonials = await loadTestimonials();

    return Response.json(testimonials, {
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

    const name = String(body.name || '');
    const role = String(body.role || '');

    const data: Record<string, string> = {
        industry: String(body.industry || ''),
        name,
        quote: String(body.quote || ''),
        role,
    };

    let id = body.id ? String(body.id) : null;

    if (!id) {
        if (!name || !role) return Response.json({ error: 'Name and role are required' }, { status: 400 });

        id = slugify(`${name}-${role}`);
    }

    if (DEV) {
        writeEntry('testimonials', id, data);
    } else {
        await getStore({ consistency: 'strong', name: 'testimonials' }).setJSON(id, data);
    }

    return Response.json({ id, ...data });
};
