import { afterEach, describe, expect, test, vi } from 'vitest';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

import { POST } from '../../src/pages/api/contact';

import type { Mock } from 'vitest';

type PostHandler = typeof POST;
type RouteContext = Parameters<typeof POST>[0];
type SendMock = Mock<(payload: SendPayload) => Promise<SendResult>>;

interface RateRecord {
    count: number;
    windowStart: number;
}

interface RateStoreStub {
    get: Mock<(key: string) => Promise<RateRecord | null>>;
    setJSON: Mock<(key: string, value: RateRecord) => Promise<void>>;
}

interface SendPayload {
    from: string;
    html: string;
    replyTo?: string;
    subject: string;
    to: string;
}

interface SendResult {
    error: { message: string } | null;
}

const CONFIG_ERROR = 'Email service not configured';
const CONTACT_TO = 'owner@example.com';
const EMAIL_ERROR = 'Please enter a valid email (max 200 characters)';
const EMAIL_FROM = 'InterSub <noreply@intersubstudio.com>';
const GLOBAL_KEY = 'contact-global';
const GLOBAL_LIMIT = 50;
const MESSAGE_ERROR = 'Message is required (max 2000 characters)';
const NAME_ERROR = 'Name is required (max 100 characters)';
const RATE_ERROR = 'Too many requests. Please try again later.';
const RATE_LIMIT = 10;
const RATE_WINDOW = 3_600_000;
const SEND_ERROR = 'Failed to send message';
const WECHAT_ERROR = 'WeChat is required, no spaces (max 50 characters)';

const templatePath = join(process.cwd(), 'src/lib/contact.html');

function buildRateStore(records: Record<string, RateRecord>): RateStoreStub {
    return {
        get: vi.fn(async (key: string) => records[key] ?? null),
        setJSON: vi.fn(async (key: string, value: RateRecord) => {
            records[key] = value;
        }),
    };
}

function buildSendBody(overrides: Record<string, unknown> = {}): string {
    return JSON.stringify({ message: 'Hello', name: 'Kevin', wechat: 'kevin', ...overrides });
}

function buildSendMock(result: SendResult): SendMock {
    const send: SendMock = vi.fn();

    send.mockResolvedValue(result);

    return send;
}

function createContext(body: string, clientAddress = '127.0.0.1'): RouteContext {
    return {
        clientAddress,
        request: new Request('http://localhost/api/contact', {
            body,
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        }),
    } as RouteContext;
}

async function importProductionPost(getStoreStub: () => RateStoreStub): Promise<PostHandler> {
    vi.resetModules();
    vi.doMock('@netlify/blobs', () => ({ getStore: getStoreStub }));
    vi.doMock('../../src/lib/constants', async (importOriginal) => {
        const original = await importOriginal<typeof import('../../src/lib/constants')>();

        return { ...original, IS_DEV: false };
    });

    const module = await import('../../src/pages/api/contact');

    return module.POST;
}

async function importSendPath(send: SendMock, apiKey = 'resend-key'): Promise<PostHandler> {
    vi.doMock('resend', () => ({
        Resend: class {
            emails = { send };
        },
    }));
    vi.stubEnv('CONTACT_EMAIL', CONTACT_TO);
    vi.stubEnv('RESEND_API_KEY', apiKey);

    return importProductionPost(() => buildRateStore({}));
}

async function postJson(body: Record<string, unknown>): Promise<Response> {
    return POST(createContext(JSON.stringify(body)));
}

describe('POST', () => {
    test('rejects a malformed body', async () => {
        const response = await POST(createContext('{'));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe('Invalid request body');
    });

    test('rejects a missing name', async () => {
        const response = await postJson({});
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(NAME_ERROR);
    });

    test('rejects a name over 100 characters', async () => {
        const response = await postJson({ name: 'a'.repeat(101) });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(NAME_ERROR);
    });

    test('rejects a missing wechat', async () => {
        const response = await postJson({ name: 'Kevin' });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(WECHAT_ERROR);
    });

    test('rejects a wechat with spaces', async () => {
        const response = await postJson({ name: 'Kevin', wechat: 'kevin huang' });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(WECHAT_ERROR);
    });

    test('rejects a wechat over 50 characters', async () => {
        const response = await postJson({ name: 'Kevin', wechat: 'a'.repeat(51) });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(WECHAT_ERROR);
    });

    test('rejects an invalid email', async () => {
        const response = await postJson({ email: 'not-an-email', name: 'Kevin', wechat: 'kevin' });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(EMAIL_ERROR);
    });

    test('rejects an email over 200 characters', async () => {
        const response = await postJson({ email: `${'a'.repeat(195)}@test.com`, name: 'Kevin', wechat: 'kevin' });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(EMAIL_ERROR);
    });

    test('allows an empty email string past the email check', async () => {
        const response = await postJson({ email: '', name: 'Kevin', wechat: 'kevin' });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(MESSAGE_ERROR);
    });

    test('rejects a missing message', async () => {
        const response = await postJson({ name: 'Kevin', wechat: 'kevin' });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(MESSAGE_ERROR);
    });

    test('rejects a message over 2000 characters', async () => {
        const response = await postJson({ message: 'a'.repeat(2_001), name: 'Kevin', wechat: 'kevin' });
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(MESSAGE_ERROR);
    });
});

describe('rate limiter', () => {
    afterEach(() => {
        vi.doUnmock('@netlify/blobs');
        vi.doUnmock('../../src/lib/constants');
        vi.resetModules();
        vi.restoreAllMocks();
    });

    test('increments the per-ip and global counters under the limit and proceeds to validation', async () => {
        const windowStart = Date.now() - 1_000;
        const store = buildRateStore({ 'contact-9.9.9.9': { count: 3, windowStart } });
        const post = await importProductionPost(() => store);

        const response = await post(createContext('{}', '9.9.9.9'));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(NAME_ERROR);
        expect(store.setJSON).toHaveBeenCalledTimes(2);
        expect(store.setJSON).toHaveBeenCalledWith('contact-9.9.9.9', { count: 4, windowStart });
        expect(store.setJSON).toHaveBeenCalledWith(GLOBAL_KEY, { count: 1, windowStart: expect.any(Number) });
    });

    test('returns 429 once an ip reaches the rate limit within the window', async () => {
        const store = buildRateStore({ 'contact-9.9.9.9': { count: RATE_LIMIT, windowStart: Date.now() } });
        const post = await importProductionPost(() => store);

        const response = await post(createContext('{}', '9.9.9.9'));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(429);
        expect(result.error).toBe(RATE_ERROR);
        expect(store.setJSON).not.toHaveBeenCalled();
    });

    test('returns 429 for a fresh ip once the global limit is reached', async () => {
        const store = buildRateStore({ [GLOBAL_KEY]: { count: GLOBAL_LIMIT, windowStart: Date.now() } });
        const post = await importProductionPost(() => store);

        const response = await post(createContext('{}', '8.8.8.8'));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(429);
        expect(result.error).toBe(RATE_ERROR);
        expect(store.setJSON).toHaveBeenCalledExactlyOnceWith('contact-8.8.8.8', { count: 1, windowStart: expect.any(Number) });
    });

    test('restarts the per-ip count when the window has expired', async () => {
        const requestedAt = Date.now();
        const store = buildRateStore({ 'contact-6.6.6.6': { count: RATE_LIMIT, windowStart: requestedAt - RATE_WINDOW - 1_000 } });
        const post = await importProductionPost(() => store);

        const response = await post(createContext('{}', '6.6.6.6'));
        const result: Record<string, unknown> = await response.json();
        const payload = store.setJSON.mock.calls.find(call => call[0] === 'contact-6.6.6.6')?.[1];

        expect(response.status).toBe(400);
        expect(result.error).toBe(NAME_ERROR);
        expect(payload?.count).toBe(1);
        expect(payload?.windowStart).toBeGreaterThanOrEqual(requestedAt);
    });

    test('fails open to validation when the store read throws', async () => {
        const store = buildRateStore({});

        store.get.mockRejectedValue(new Error('blobs offline'));

        const post = await importProductionPost(() => store);

        const response = await post(createContext('{}', '9.9.9.9'));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(NAME_ERROR);
    });

    test('fails open to validation when the store write throws', async () => {
        const store = buildRateStore({});

        store.setJSON.mockRejectedValue(new Error('blobs offline'));

        const post = await importProductionPost(() => store);

        const response = await post(createContext('{}', '9.9.9.9'));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(400);
        expect(result.error).toBe(NAME_ERROR);
    });
});

describe('send path', () => {
    afterEach(() => {
        vi.doUnmock('@netlify/blobs');
        vi.doUnmock('resend');
        vi.doUnmock('../../src/lib/constants');
        vi.resetModules();
        vi.unstubAllEnvs();
    });

    test('returns 503 when the resend api key is blank', async () => {
        const send = buildSendMock({ error: null });
        const post = await importSendPath(send, '');

        const response = await post(createContext(buildSendBody()));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(503);
        expect(result.error).toBe(CONFIG_ERROR);
        expect(send).not.toHaveBeenCalled();
    });

    test('sends the escaped and substituted template through the mocked client', async () => {
        const send = buildSendMock({ error: null });
        const post = await importSendPath(send);

        const response = await post(createContext(buildSendBody({
            email: 'reply@example.com',
            message: '<script>alert(1)</script> & < > "',
            name: 'Ann & "Bo" <Cy>',
        })));
        const result: Record<string, unknown> = await response.json();
        const payload = send.mock.lastCall?.[0];

        expect(response.status).toBe(200);
        expect(result.sent).toBe(true);
        expect(send).toHaveBeenCalledTimes(1);
        expect(payload?.from).toBe(EMAIL_FROM);
        expect(payload?.replyTo).toBe('reply@example.com');
        expect(payload?.subject).toBe('New inquiry from Ann & "Bo" <Cy>');
        expect(payload?.to).toBe(CONTACT_TO);
        expect(payload?.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt; &gt; &quot;');
        expect(payload?.html).toContain('Ann &amp; &quot;Bo&quot; &lt;Cy&gt;');
        expect(payload?.html).toContain('mailto:reply@example.com');
        expect(payload?.html).not.toContain('<script>');
        expect(payload?.html).not.toContain('</script>');
        expect(payload?.html).not.toMatch(/\{\{(emailRow|message|name|wechat)\}\}/);
    });

    test('omits replyTo and the email row when no email is provided', async () => {
        const send = buildSendMock({ error: null });
        const post = await importSendPath(send);

        const response = await post(createContext(buildSendBody()));
        const result: Record<string, unknown> = await response.json();
        const payload = send.mock.lastCall?.[0];

        expect(response.status).toBe(200);
        expect(result.sent).toBe(true);
        expect(send).toHaveBeenCalledTimes(1);
        expect(payload).not.toHaveProperty('replyTo');
        expect(payload?.html).not.toContain('mailto:');
        expect(payload?.html).not.toMatch(/\{\{(emailRow|message|name|wechat)\}\}/);
    });

    test('returns 500 when the mocked client resolves with an error', async () => {
        const send = buildSendMock({ error: { message: 'boom' } });
        const post = await importSendPath(send);

        const response = await post(createContext(buildSendBody()));
        const result: Record<string, unknown> = await response.json();

        expect(response.status).toBe(500);
        expect(result.error).toBe(SEND_ERROR);
        expect(send).toHaveBeenCalledTimes(1);
    });
});

describe('template', () => {
    test('contains the substitution tokens', () => {
        const template = readFileSync(templatePath, 'utf-8');

        expect(template).toContain('{{emailRow}}');
        expect(template).toContain('{{message}}');
        expect(template).toContain('{{name}}');
        expect(template).toContain('{{wechat}}');
    });
});
