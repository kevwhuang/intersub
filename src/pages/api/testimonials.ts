import { getStore } from '@netlify/blobs';

import { IS_DEV } from '@lib/constants';
import { deleteEntry, readCollection, writeEntry } from '@lib/local';
import { getTestimonials } from '@lib/store';
import { verifyAuth } from '@lib/authServer';

import type { APIRoute } from 'astro';

async function loadTestimonials(): Promise<AdminTestimonial[]> {
    if (IS_DEV) return readCollection<AdminTestimonial>('testimonials');

    return getTestimonials();
}

function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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

    const testimonials = await loadTestimonials();

    if (!testimonials.find(entry => String(entry.id) === String(id))) {
        return Response.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    if (IS_DEV) {
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

    if (!body || typeof body !== 'object') return Response.json({ error: 'Invalid request body' }, { status: 400 });

    const industry = String(body.industry || '').trim();
    const name = String(body.name || '').trim();
    const quote = String(body.quote || '').trim();
    const role = String(body.role || '').trim();

    if (!industry) return Response.json({ error: 'Industry is required' }, { status: 400 });
    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
    if (!quote) return Response.json({ error: 'Quote is required' }, { status: 400 });
    if (!role) return Response.json({ error: 'Role is required' }, { status: 400 });

    const data: Record<string, string> = { industry, name, quote, role };

    const testimonials = await loadTestimonials();

    let id = body.id ? String(body.id) : null;

    if (id && !testimonials.find(entry => String(entry.id) === id)) {
        return Response.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    if (!id) {
        id = slugify(`${name}-${role}`) || String(Date.now());

        if (testimonials.find(entry => String(entry.id) === id)) {
            return Response.json({ error: 'A testimonial for this name and role already exists' }, { status: 409 });
        }
    }

    if (IS_DEV) {
        writeEntry('testimonials', id, data);
    } else {
        await getStore({ consistency: 'strong', name: 'testimonials' }).setJSON(id, data);
    }

    return Response.json({ id, ...data });
};
