import { Resend } from 'resend';

import type { APIRoute } from 'astro';

import template from '@lib/contact.html?raw';

const MAX_EMAIL = 200;
const MAX_MESSAGE = 2_000;
const MAX_NAME = 100;
const MAX_WEIXIN = 50;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    let body: Record<string, string>;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, message, name, weixin } = body;

    if (!name?.trim() || name.trim().length > MAX_NAME) return Response.json({ error: `Name is required (max ${MAX_NAME} characters)` }, { status: 400 });

    if (!weixin?.trim() || /\s/.test(weixin.trim()) || weixin.trim().length > MAX_WEIXIN) return Response.json({ error: `Weixin is required, no spaces (max ${MAX_WEIXIN} characters)` }, { status: 400 });

    if (email?.trim() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > MAX_EMAIL)) {
        return Response.json({ error: `Please enter a valid email (max ${MAX_EMAIL} characters)` }, { status: 400 });
    }

    if (!message?.trim() || message.trim().length > MAX_MESSAGE) return Response.json({ error: `Message is required (max ${MAX_MESSAGE} characters)` }, { status: 400 });

    const apiKey = import.meta.env.RESEND_API_KEY;

    if (!apiKey) {
        if (import.meta.env.DEV) return Response.json({ sent: true });

        return Response.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    function esc(str: string) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    const trimmed = {
        email: esc(email?.trim() ?? ''),
        message: esc(message.trim()),
        name: esc(name.trim()),
        weixin: esc(weixin.trim()),
    };

    const emailRow = trimmed.email
        ? `<tr>
                <td style="color: #6e7482; font-size: 16px; padding: 6px 12px 6px 0; vertical-align: top; white-space: nowrap">Email</td>
                <td style="color: #14161c; font-size: 16px; padding: 6px 0; word-break: break-word"><a href="mailto:${trimmed.email}" style="color: #2a52e0; text-decoration: none">${trimmed.email}</a></td>
            </tr>`
        : '';

    const html = template
        .replace(/\{\{name\}\}/g, trimmed.name)
        .replace('{{weixin}}', trimmed.weixin)
        .replace('{{emailRow}}', emailRow)
        .replace('{{message}}', trimmed.message);

    const { error } = await resend.emails.send({
        from: 'InterSub <noreply@intersubstudio.com>',
        html,
        ...(trimmed.email && { replyTo: trimmed.email }),
        subject: `New inquiry from ${trimmed.name}`,
        to: import.meta.env.CONTACT_EMAIL as string,
    });

    if (error) return Response.json({ error: 'Failed to send message' }, { status: 500 });

    return Response.json({ sent: true });
};
