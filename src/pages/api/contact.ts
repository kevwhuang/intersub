import { Resend } from 'resend';
import { getStore } from '@netlify/blobs';

import template from '@lib/contact.html?raw';
import { EMAIL_MAX, EMAIL_PATTERN, ERROR_RATE_LIMITED, IS_DEV, MESSAGE_MAX, NAME_MAX, WECHAT_MAX } from '@lib/constants';

import type { APIRoute } from 'astro';
import type { Store } from '@netlify/blobs';

const COBALT = '#2a52e0';
const EMAIL_FROM = 'InterSub <noreply@intersubstudio.com>';
const GLOBAL_KEY = 'contact-global';
const GLOBAL_LIMIT = 50;
const GLOBAL_WINDOW = 86_400_000;
const RATE_LIMIT = 10;
const RATE_WINDOW = 3_600_000;
const SLATE = '#14161c';
const SLATE_MUTED = '#4a515e';

function escapeHtml(text: string) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function isQuotaExhausted(store: Store, key: string, limit: number, windowDuration: number): Promise<boolean> {
    const now = Date.now();

    const record = await store.get(key, { type: 'json' });

    const isSameWindow = record && now - record.windowStart < windowDuration;

    if (isSameWindow && record.count >= limit) return true;

    await store.setJSON(key, isSameWindow ? { count: record.count + 1, windowStart: record.windowStart } : { count: 1, windowStart: now });

    return false;
}

async function isRateLimited(clientAddress: string): Promise<boolean> {
    if (IS_DEV) return false;

    try {
        const store = getStore({ consistency: 'strong', name: 'rate-limits' });

        if (await isQuotaExhausted(store, `contact-${clientAddress}`, RATE_LIMIT, RATE_WINDOW)) return true;

        return await isQuotaExhausted(store, GLOBAL_KEY, GLOBAL_LIMIT, GLOBAL_WINDOW);
    } catch {
        return false;
    }
}

export const prerender = false;

export const POST: APIRoute = async ({ clientAddress, request }) => {
    let body: Record<string, unknown>;

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') return Response.json({ error: 'Invalid request body' }, { status: 400 });

    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();
    const name = String(body.name ?? '').trim();
    const wechat = String(body.wechat ?? '').trim();

    if (!name || name.length > NAME_MAX) {
        return Response.json({ error: `Name is required (max ${NAME_MAX} characters)` }, { status: 400 });
    }

    if (!wechat || /\s/.test(wechat) || wechat.length > WECHAT_MAX) {
        return Response.json({ error: `WeChat is required, no spaces (max ${WECHAT_MAX} characters)` }, { status: 400 });
    }

    if (email && (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX)) {
        return Response.json({ error: `Please enter a valid email (max ${EMAIL_MAX} characters)` }, { status: 400 });
    }

    if (!message || message.length > MESSAGE_MAX) {
        return Response.json({ error: `Message is required (max ${MESSAGE_MAX} characters)` }, { status: 400 });
    }

    if (await isRateLimited(clientAddress)) return Response.json({ error: ERROR_RATE_LIMITED }, { status: 429 });

    if (IS_DEV) return Response.json({ sent: true });

    const apiKey = import.meta.env.RESEND_API_KEY;
    const contactEmail = import.meta.env.CONTACT_EMAIL;

    if (!apiKey || !contactEmail) return Response.json({ error: 'Email service not configured' }, { status: 503 });

    const resend = new Resend(apiKey);

    const escaped = {
        email: escapeHtml(email),
        message: escapeHtml(message),
        name: escapeHtml(name),
        wechat: escapeHtml(wechat),
    };

    const emailRow = escaped.email
        ? `<tr>
                <td style="color: ${SLATE_MUTED}; font-size: 16px; padding: 6px 12px 6px 0; vertical-align: top; white-space: nowrap">Email</td>
                <td style="color: ${SLATE}; font-size: 16px; padding: 6px 0; word-break: break-word"><a href="mailto:${escaped.email}" style="color: ${COBALT}; text-decoration: none">${escaped.email}</a></td>
            </tr>`
        : '';

    const replacements: Record<string, string> = {
        emailRow,
        message: escaped.message,
        name: escaped.name,
        wechat: escaped.wechat,
    };

    const html = template.replace(/\{\{(emailRow|message|name|wechat)\}\}/g, (_, token: string) => replacements[token]);

    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        html,
        ...(email && { replyTo: email }),
        subject: `New inquiry from ${name}`,
        to: contactEmail,
    });

    if (error) return Response.json({ error: 'Failed to send message' }, { status: 500 });

    return Response.json({ sent: true });
};
