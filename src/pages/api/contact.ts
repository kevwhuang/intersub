import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    let body: Record<string, string>;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, message, name } = body;

    if (!name?.trim()) {
        return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() ?? '')) {
        return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if ((message?.trim() ?? '').length < 10) {
        return Response.json({ error: 'Message must be at least 10 characters' }, { status: 400 });
    }

    return Response.json({ sent: true });
};
