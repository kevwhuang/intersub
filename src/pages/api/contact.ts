import { getStore } from '@netlify/blobs';
import { Resend } from 'resend';

import template from '@lib/contact.html?raw';
import { EMAIL_PATTERN, IS_DEV, MESSAGE_MAX, NAME_MAX } from '@lib/constants';

import type { APIRoute } from 'astro';

const EMAIL_MAX = 200;
const RATE_LIMIT = 5;
const RATE_WINDOW = 3_600_000;
const WECHAT_MAX = 50;

async function isRateLimited(clientAddress: string): Promise<boolean> {
    if (IS_DEV) return false;

    try {
        const key = `contact-${clientAddress}`;
        const now = Date.now();
        const store = getStore({ consistency: 'strong', name: 'rate-limits' });

        const record = await store.get(key, { type: 'json' });

        const isSameWindow = record && now - record.windowStart < RATE_WINDOW;

        if (isSameWindow && record.count >= RATE_LIMIT) return true;

        await store.setJSON(key, isSameWindow ? { count: record.count + 1, windowStart: record.windowStart } : { count: 1, windowStart: now });

        return false;
    } catch {
        return false;
    }
}

export const prerender = false;

export const POST: APIRoute = async ({ clientAddress, request }) => {
    if (await isRateLimited(clientAddress)) return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

    let body: Record<string, string>;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, message, name, wechat } = body;

    if (!name?.trim() || name.trim().length > NAME_MAX) return Response.json({ error: `Name is required (max ${NAME_MAX} characters)` }, { status: 400 });

    if (!wechat?.trim() || /\s/.test(wechat.trim()) || wechat.trim().length > WECHAT_MAX) return Response.json({ error: `WeChat is required, no spaces (max ${WECHAT_MAX} characters)` }, { status: 400 });

    if (email?.trim() && (!EMAIL_PATTERN.test(email.trim()) || email.trim().length > EMAIL_MAX)) return Response.json({ error: `Please enter a valid email (max ${EMAIL_MAX} characters)` }, { status: 400 });

    if (!message?.trim() || message.trim().length > MESSAGE_MAX) return Response.json({ error: `Message is required (max ${MESSAGE_MAX} characters)` }, { status: 400 });

    const apiKey = import.meta.env.RESEND_API_KEY;

    if (!apiKey) {
        if (import.meta.env.DEV) return Response.json({ sent: true });

        return Response.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    function escapeHtml(text: string) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    const raw = {
        email: email?.trim() ?? '',
        message: message.trim(),
        name: name.trim(),
        wechat: wechat.trim(),
    };

    const escaped = {
        email: escapeHtml(raw.email),
        message: escapeHtml(raw.message),
        name: escapeHtml(raw.name),
        wechat: escapeHtml(raw.wechat),
    };

    const emailRow = escaped.email
        ? `<tr>
                <td style="color: #6e7482; font-size: 16px; padding: 6px 12px 6px 0; vertical-align: top; white-space: nowrap">Email</td>
                <td style="color: #14161c; font-size: 16px; padding: 6px 0; word-break: break-word"><a href="mailto:${escaped.email}" style="color: #2a52e0; text-decoration: none">${escaped.email}</a></td>
            </tr>`
        : '';

    const html = template
        .replace(/\{\{name\}\}/g, () => escaped.name)
        .replace('{{wechat}}', () => escaped.wechat)
        .replace('{{emailRow}}', () => emailRow)
        .replace('{{message}}', () => escaped.message);

    const { error } = await resend.emails.send({
        from: 'InterSub <noreply@intersubstudio.com>',
        html,
        ...(raw.email && { replyTo: raw.email }),
        subject: `New inquiry from ${raw.name}`,
        to: import.meta.env.CONTACT_EMAIL as string,
    });

    if (error) return Response.json({ error: 'Failed to send message' }, { status: 500 });

    return Response.json({ sent: true });
};
