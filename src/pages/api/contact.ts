import { Resend } from 'resend';

import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    let body: Record<string, string>;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, message, name, weixin } = body;

    if (!name?.trim()) {
        return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() ?? '')) {
        return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if ((message?.trim() ?? '').length < 10) {
        return Response.json({ error: 'Message must be at least 10 characters' }, { status: 400 });
    }

    const apiKey = import.meta.env.RESEND_API_KEY;

    if (!apiKey) {
        if (import.meta.env.DEV) return Response.json({ sent: true });

        return Response.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
        from: 'InterSub <noreply@intersubstudio.com>',
        replyTo: email.trim(),
        subject: `New inquiry from ${name.trim()}`,
        text: [
            `Name: ${name.trim()}`,
            `Email: ${email.trim()}`,
            weixin?.trim() ? `Weixin: ${weixin.trim()}` : '',
            '',
            message.trim(),
        ].filter(Boolean).join('\n'),
        to: 'lydia@intersubstudio.com',
    });

    if (error) {
        return Response.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return Response.json({ sent: true });
};
