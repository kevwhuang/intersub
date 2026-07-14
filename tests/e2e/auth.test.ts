import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

type IdentityResponder = (call: IdentityCall) => IdentityReply | Promise<IdentityReply | null> | null;

interface IdentityCall {
    authorization: string;
    body: string;
    method: string;
    path: string;
}

interface IdentityMock {
    calls: IdentityCall[];
    unmatched: string[];
}

interface IdentityReply {
    json: unknown;
    status: number;
}

const ADMIN_EMAIL = 'admin@intersub.com';
const AUTH_KEY = 'intersub_auth';
const CONFIRMED_EMAIL = 'confirmed@intersub.com';
const DEFAULT_BASE = 'http://localhost:8888';
const IDENTITY_PATH = '/.netlify/identity';
const INVALID_LINK_ERROR = 'This link is invalid or has expired.';
const INVITED_EMAIL = 'invited@intersub.com';
const MAPPED_HOST = 'intersub.localhost';
const OFFLINE_ERROR = 'You appear to be offline. Please try again.';
const PASSWORD_ERROR = 'Password must be 8\u201320 characters.';
const RECOVERED_EMAIL = 'recovered@intersub.com';
const RESEEDED_ACCESS_TOKEN = 'reseeded-access-token';
const RESEEDED_EMAIL = 'reseeded@intersub.com';
const RESEEDED_REFRESH_TOKEN = 'reseeded-refresh-token';
const SEEDED_EMAIL = 'stored@intersub.com';
const SEEDED_REFRESH_TOKEN = 'stored-refresh-token';
const SESSION_EXPIRED_ERROR = 'Session expired. Please sign in again.';

const TOKEN_RESPONSE = {
    access_token: 'fresh-access-token',
    expires_in: 3_600,
    refresh_token: 'fresh-refresh-token',
    token_type: 'bearer',
};

async function blockApiWrites(page: Page) {
    const writes: string[] = [];

    await page.route('**/api/**', async (route) => {
        const request = route.request();

        if (request.method() === 'GET') {
            await route.fallback();

            return;
        }

        writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
        await route.abort();
    });

    return writes;
}

async function expireSession(page: Page) {
    await page.evaluate((key) => {
        const raw = window.localStorage.getItem(key);

        if (!raw) return;

        const session = JSON.parse(raw) as StoredSession;

        session.expiresAt = Date.now() - 1_000;
        window.localStorage.setItem(key, JSON.stringify(session));
    }, AUTH_KEY);
}

function getAdminUrl(baseURL: string | undefined, hash = '') {
    const { port } = new URL(baseURL ?? DEFAULT_BASE);

    return `http://${MAPPED_HOST}:${port}/admin${hash}`;
}

async function mockIdentity(page: Page, respond: IdentityResponder): Promise<IdentityMock> {
    const mock: IdentityMock = { calls: [], unmatched: [] };

    await page.route(`**${IDENTITY_PATH}/**`, async (route) => {
        const request = route.request();

        const call: IdentityCall = {
            authorization: await request.headerValue('authorization') ?? '',
            body: request.postData() ?? '',
            method: request.method(),
            path: new URL(request.url()).pathname.replace(IDENTITY_PATH, ''),
        };

        mock.calls.push(call);

        const reply = await respond(call);

        if (!reply) {
            mock.unmatched.push(`${call.method} ${call.path}`);
            await route.abort();

            return;
        }

        await route.fulfill({ json: reply.json, status: reply.status });
    });

    return mock;
}

async function openFirstEventEdit(page: Page) {
    await page.getByRole('table', { name: 'Events' }).getByRole('row').nth(1).getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
}

async function parseSession(page: Page): Promise<StoredSession | null> {
    const raw = await readSession(page);

    return raw ? JSON.parse(raw) as StoredSession : null;
}

async function readSession(page: Page) {
    return page.evaluate(key => window.localStorage.getItem(key), AUTH_KEY);
}

async function reseedValidSession(page: Page) {
    await page.evaluate(({ accessToken, email, key, refreshToken }) => {
        window.localStorage.setItem(key, JSON.stringify({
            accessToken,
            email,
            expiresAt: Date.now() + 3_600_000,
            refreshToken,
        }));
    }, { accessToken: RESEEDED_ACCESS_TOKEN, email: RESEEDED_EMAIL, key: AUTH_KEY, refreshToken: RESEEDED_REFRESH_TOKEN });
}

async function seedSession(page: Page, offsetMs: number) {
    await page.addInitScript(({ email, key, offset, refreshToken }) => {
        window.localStorage.setItem(key, JSON.stringify({
            accessToken: 'stored-access-token',
            email,
            expiresAt: Date.now() + offset,
            refreshToken,
        }));
    }, { email: SEEDED_EMAIL, key: AUTH_KEY, offset: offsetMs, refreshToken: SEEDED_REFRESH_TOKEN });
}

async function signIn(page: Page, baseURL: string | undefined) {
    await page.goto(getAdminUrl(baseURL));
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
}

test.use({
    launchOptions: { args: [`--host-resolver-rules=MAP ${MAPPED_HOST} [::1]`] },
});

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('login screen', () => {
    test('shows the login screen on unauthenticated load without identity traffic', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, () => null);

        await page.goto(getAdminUrl(baseURL));

        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Back to site' })).toBeVisible();
        expect(mock.calls).toEqual([]);
    });

    test('shows a validation error for empty credentials without identity traffic', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, () => null);

        await page.goto(getAdminUrl(baseURL));
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByRole('alert')).toHaveText('Email and password are required.');
        expect(mock.calls).toEqual([]);
    });

    test('shows an invalid-credentials error when the password grant returns 401', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/token') {
                return { json: { error: 'invalid_grant' }, status: 401 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL));
        await page.getByLabel('Email').fill(ADMIN_EMAIL);
        await page.getByLabel('Password').fill('wrong-password');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
        expect(mock.calls).toEqual([{
            authorization: '',
            body: `grant_type=password&username=${encodeURIComponent(ADMIN_EMAIL)}&password=wrong-password`,
            method: 'POST',
            path: '/token',
        }]);
        expect(mock.unmatched).toEqual([]);
    });

    test('shows a generic error when the password grant returns 500', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/token') {
                return { json: { code: 500, msg: 'Internal server error' }, status: 500 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL));
        await page.getByLabel('Email').fill(ADMIN_EMAIL);
        await page.getByLabel('Password').fill('any-password');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByRole('alert')).toHaveText('Something went wrong. Please try again.');
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });

    test('signs in on a successful password grant, persists the session, and skips login on reload', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/token') return { json: TOKEN_RESPONSE, status: 200 };

            return null;
        });

        await page.goto(getAdminUrl(baseURL));
        await page.getByLabel('Email').fill(ADMIN_EMAIL);
        await page.getByLabel('Password').fill('correct-password');

        const before = Date.now();

        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByRole('complementary', { name: 'Admin sidebar' }).getByText('AD', { exact: true })).toBeVisible();

        const stored = await parseSession(page);
        const after = Date.now();

        expect(stored?.accessToken).toBe(TOKEN_RESPONSE.access_token);
        expect(stored?.email).toBe(ADMIN_EMAIL);
        expect(stored?.expiresAt).toBeGreaterThanOrEqual(before + TOKEN_RESPONSE.expires_in * 1_000);
        expect(stored?.expiresAt).toBeLessThanOrEqual(after + TOKEN_RESPONSE.expires_in * 1_000);
        expect(stored?.refreshToken).toBe(TOKEN_RESPONSE.refresh_token);
        expect(mock.calls).toEqual([{
            authorization: '',
            body: `grant_type=password&username=${encodeURIComponent(ADMIN_EMAIL)}&password=correct-password`,
            method: 'POST',
            path: '/token',
        }]);

        await page.reload();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        expect(mock.calls).toHaveLength(1);
    });
});

test.describe('stored sessions', () => {
    test('skips login when a valid session is stored', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, () => null);

        await seedSession(page, 3_600_000);
        await page.goto(getAdminUrl(baseURL));

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByRole('complementary', { name: 'Admin sidebar' }).getByText('ST', { exact: true })).toBeVisible();
        expect(mock.calls).toEqual([]);
    });

    test('refreshes an expired session with a refresh_token grant and stays on the dashboard', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/token') return { json: TOKEN_RESPONSE, status: 200 };

            return null;
        });

        await seedSession(page, -1_000);
        await page.goto(getAdminUrl(baseURL));

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();

        const stored = await parseSession(page);

        expect(stored?.accessToken).toBe(TOKEN_RESPONSE.access_token);
        expect(stored?.email).toBe(SEEDED_EMAIL);
        expect(stored?.refreshToken).toBe(TOKEN_RESPONSE.refresh_token);
        expect(mock.calls).toEqual([{
            authorization: '',
            body: `grant_type=refresh_token&refresh_token=${SEEDED_REFRESH_TOKEN}`,
            method: 'POST',
            path: '/token',
        }]);
    });

    test('clears the session and shows login when the refresh grant returns 401', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/token') {
                return { json: { error: 'invalid_grant' }, status: 401 };
            }

            return null;
        });

        await seedSession(page, -1_000);
        await page.goto(getAdminUrl(baseURL));

        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
        expect(await readSession(page)).toBeNull();
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });

    test('falls back to login when the stored session is malformed JSON', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, () => null);

        await page.addInitScript(key => window.localStorage.setItem(key, '{not valid json'), AUTH_KEY);
        await page.goto(getAdminUrl(baseURL));

        await expect(page.getByLabel('Email')).toBeVisible();
        expect(mock.calls).toEqual([]);
    });

    test('sign out clears the stored session and returns to login', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, () => null);

        await seedSession(page, 3_600_000);
        await page.goto(getAdminUrl(baseURL));
        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();

        await page.getByRole('button', { name: 'Sign out' }).click();

        await expect(page.getByLabel('Email')).toBeVisible();
        expect(await readSession(page)).toBeNull();
        expect(mock.calls).toEqual([]);
    });
});

test.describe('refresh races', () => {
    test('a successful refresh does not overwrite a session reseeded mid-flight by another tab', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, async (call) => {
            if (call.method !== 'POST' || call.path !== '/token') return null;

            await reseedValidSession(page);

            return { json: TOKEN_RESPONSE, status: 200 };
        });

        await seedSession(page, -1_000);
        await page.goto(getAdminUrl(baseURL));

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByRole('complementary', { name: 'Admin sidebar' }).getByText('RE', { exact: true })).toBeVisible();

        const stored = await parseSession(page);

        expect(stored?.accessToken).toBe(RESEEDED_ACCESS_TOKEN);
        expect(stored?.email).toBe(RESEEDED_EMAIL);
        expect(stored?.refreshToken).toBe(RESEEDED_REFRESH_TOKEN);
        expect(mock.calls).toEqual([{
            authorization: '',
            body: `grant_type=refresh_token&refresh_token=${SEEDED_REFRESH_TOKEN}`,
            method: 'POST',
            path: '/token',
        }]);
        expect(mock.unmatched).toEqual([]);
    });

    test('a 401 refresh does not clear a session reseeded mid-flight by another tab', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, async (call) => {
            if (call.method !== 'POST' || call.path !== '/token') return null;

            await reseedValidSession(page);

            return { json: { error: 'invalid_grant' }, status: 401 };
        });

        await seedSession(page, -1_000);
        await page.goto(getAdminUrl(baseURL));

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByRole('complementary', { name: 'Admin sidebar' }).getByText('RE', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Email')).toHaveCount(0);
        await expect(page.getByText(SESSION_EXPIRED_ERROR)).toHaveCount(0);

        const stored = await parseSession(page);

        expect(stored?.accessToken).toBe(RESEEDED_ACCESS_TOKEN);
        expect(stored?.email).toBe(RESEEDED_EMAIL);
        expect(stored?.refreshToken).toBe(RESEEDED_REFRESH_TOKEN);
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });
});

test.describe('confirmation flow', () => {
    test('a valid confirmation token verifies a signup and signs in without the set-password screen', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { ...TOKEN_RESPONSE, email: CONFIRMED_EMAIL }, status: 200 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#confirmation_token=xyz'));

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Set your password' })).toHaveCount(0);
        await expect(page).toHaveURL(getAdminUrl(baseURL));

        const stored = await parseSession(page);

        expect(stored?.accessToken).toBe(TOKEN_RESPONSE.access_token);
        expect(stored?.email).toBe(CONFIRMED_EMAIL);
        expect(mock.calls).toEqual([{
            authorization: '',
            body: '{"token":"xyz","type":"signup"}',
            method: 'POST',
            path: '/verify',
        }]);
        expect(mock.unmatched).toEqual([]);
    });

    test('an invalid confirmation token shows an error on the login screen', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { code: 404, msg: 'Confirmation token not found' }, status: 404 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#confirmation_token=expired'));

        await expect(page.getByRole('alert')).toHaveText(INVALID_LINK_ERROR);
        await expect(page.getByLabel('Email')).toBeVisible();
        expect(await readSession(page)).toBeNull();
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });
});

test.describe('recovery flow', () => {
    test('a valid recovery token opens the set-password screen and strips the hash', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { ...TOKEN_RESPONSE, email: RECOVERED_EMAIL }, status: 200 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#recovery_token=abc'));

        await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back to dashboard' })).toBeVisible();
        await expect(page).toHaveURL(getAdminUrl(baseURL));

        const stored = await parseSession(page);

        expect(stored?.accessToken).toBe(TOKEN_RESPONSE.access_token);
        expect(stored?.email).toBe(RECOVERED_EMAIL);
        expect(mock.calls).toEqual([{
            authorization: '',
            body: '{"token":"abc","type":"recovery"}',
            method: 'POST',
            path: '/verify',
        }]);
    });

    test('rejects passwords shorter than 8 or longer than 20 characters without identity traffic', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { ...TOKEN_RESPONSE, email: RECOVERED_EMAIL }, status: 200 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#recovery_token=abc'));

        const passwordInput = page.getByLabel('New password');

        await passwordInput.fill('short');
        await page.getByRole('button', { name: 'Set password' }).click();
        await expect(page.getByRole('alert')).toHaveText(PASSWORD_ERROR);

        await passwordInput.evaluate((element: HTMLInputElement, value) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

            setter?.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }, 'this-password-is-far-too-long');
        await page.getByRole('button', { name: 'Set password' }).click();
        await expect(page.getByRole('alert')).toHaveText(PASSWORD_ERROR);

        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });

    test('a valid password completes recovery through the identity user endpoint', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { ...TOKEN_RESPONSE, email: RECOVERED_EMAIL }, status: 200 };
            }

            if (call.method === 'PUT' && call.path === '/user') return { json: {}, status: 200 };

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#recovery_token=abc'));
        await page.getByLabel('New password').fill('brand-new-pass');
        await page.getByRole('button', { name: 'Set password' }).click();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByRole('complementary', { name: 'Admin sidebar' }).getByText('RE', { exact: true })).toBeVisible();
        expect(mock.calls).toEqual([
            { authorization: '', body: '{"token":"abc","type":"recovery"}', method: 'POST', path: '/verify' },
            { authorization: `Bearer ${TOKEN_RESPONSE.access_token}`, body: '{"password":"brand-new-pass"}', method: 'PUT', path: '/user' },
        ]);
    });

    test('a failed password update shows an error and keeps the set-password screen open', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { ...TOKEN_RESPONSE, email: RECOVERED_EMAIL }, status: 200 };
            }

            if (call.method === 'PUT' && call.path === '/user') {
                return { json: { code: 500, msg: 'Internal server error' }, status: 500 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#recovery_token=abc'));
        await page.getByLabel('New password').fill('brand-new-pass');
        await page.getByRole('button', { name: 'Set password' }).click();

        await expect(page.getByRole('alert')).toHaveText('Failed to set password.');
        await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();
        expect(mock.calls).toHaveLength(2);
        expect(mock.unmatched).toEqual([]);
    });

    test('an expired session during set-password returns to login with a session error', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/token') {
                return { json: { error: 'invalid_grant' }, status: 401 };
            }

            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { ...TOKEN_RESPONSE, email: RECOVERED_EMAIL }, status: 200 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#recovery_token=abc'));
        await expect(page.getByRole('button', { name: 'Back to dashboard' })).toBeVisible();

        await expireSession(page);
        await page.getByLabel('New password').fill('brand-new-pass');
        await page.getByRole('button', { name: 'Set password' }).click();

        await expect(page.getByRole('alert')).toHaveText(SESSION_EXPIRED_ERROR);
        await expect(page.getByRole('button', { name: 'Back to sign in' })).toBeVisible();
        expect(await readSession(page)).toBeNull();
        expect(mock.calls).toEqual([
            { authorization: '', body: '{"token":"abc","type":"recovery"}', method: 'POST', path: '/verify' },
            { authorization: '', body: `grant_type=refresh_token&refresh_token=${TOKEN_RESPONSE.refresh_token}`, method: 'POST', path: '/token' },
        ]);
        expect(mock.unmatched).toEqual([]);

        await page.getByRole('button', { name: 'Back to sign in' }).click();

        await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('an invalid recovery token shows an error on the login screen', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { code: 404, msg: 'Recovery token not found' }, status: 404 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#recovery_token=expired'));

        await expect(page.getByRole('alert')).toHaveText(INVALID_LINK_ERROR);
        await expect(page.getByLabel('Email')).toBeVisible();
        expect(await readSession(page)).toBeNull();
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });

    test('cancel returns to the dashboard when recovery already signed in', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { ...TOKEN_RESPONSE, email: RECOVERED_EMAIL }, status: 200 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#recovery_token=abc'));
        await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();

        await page.getByRole('button', { name: 'Back to dashboard' }).click();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
        await expect(page.getByRole('complementary', { name: 'Admin sidebar' }).getByText('RE', { exact: true })).toBeVisible();
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });
});

test.describe('invite flow', () => {
    test('a valid invite token signs in and opens the set-password screen', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'GET' && call.path === '/user') return { json: { email: INVITED_EMAIL }, status: 200 };

            if (call.method === 'POST' && call.path === '/verify') return { json: TOKEN_RESPONSE, status: 200 };

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#invite_token=xyz'));

        await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back to dashboard' })).toBeVisible();
        await expect(page).toHaveURL(getAdminUrl(baseURL));

        const stored = await parseSession(page);

        expect(stored?.email).toBe(INVITED_EMAIL);
        expect(mock.calls).toEqual([
            { authorization: '', body: '{"token":"xyz","type":"signup"}', method: 'POST', path: '/verify' },
            { authorization: `Bearer ${TOKEN_RESPONSE.access_token}`, body: '', method: 'GET', path: '/user' },
        ]);
    });

    test('a failed invite probe stores the pending invite and submit verifies the signup', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method !== 'POST' || call.path !== '/verify') return null;

            if (call.body.includes('"password"')) {
                return { json: { ...TOKEN_RESPONSE, email: INVITED_EMAIL }, status: 200 };
            }

            return { json: { code: 500, msg: 'Internal server error' }, status: 500 };
        });

        await page.goto(getAdminUrl(baseURL, '#invite_token=xyz'));

        await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back to sign in' })).toBeVisible();
        expect(await readSession(page)).toBeNull();

        await page.getByLabel('New password').fill('welcome-aboard-1');
        await page.getByRole('button', { name: 'Set password' }).click();

        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();

        const stored = await parseSession(page);

        expect(stored?.email).toBe(INVITED_EMAIL);
        expect(mock.calls).toEqual([
            { authorization: '', body: '{"token":"xyz","type":"signup"}', method: 'POST', path: '/verify' },
            { authorization: '', body: '{"password":"welcome-aboard-1","token":"xyz","type":"signup"}', method: 'POST', path: '/verify' },
        ]);
    });

    test('an invite probe returning 404 shows an invalid-link error instead of the set-password screen', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { code: 404, msg: 'Invite token not found' }, status: 404 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#invite_token=missing'));

        await expect(page.getByRole('alert')).toHaveText(INVALID_LINK_ERROR);
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Set your password' })).toHaveCount(0);
        expect(await readSession(page)).toBeNull();
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });

    test('cancel with a pending invite returns to the sign-in screen', async ({ baseURL, page }) => {
        const mock = await mockIdentity(page, (call) => {
            if (call.method === 'POST' && call.path === '/verify') {
                return { json: { code: 500, msg: 'Internal server error' }, status: 500 };
            }

            return null;
        });

        await page.goto(getAdminUrl(baseURL, '#invite_token=xyz'));
        await expect(page.getByRole('heading', { name: 'Set your password' })).toBeVisible();

        await page.getByRole('button', { name: 'Back to sign in' }).click();

        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
        expect(mock.calls).toHaveLength(1);
        expect(mock.unmatched).toEqual([]);
    });
});

test.describe('session expiry during save', () => {
    test('a failed refresh at save time bounces to login, clears the session, and sends no mutation', async ({ baseURL, page }) => {
        const writes = await blockApiWrites(page);

        const mock = await mockIdentity(page, (call) => {
            if (call.method !== 'POST' || call.path !== '/token') return null;

            if (call.body.startsWith('grant_type=password')) return { json: TOKEN_RESPONSE, status: 200 };

            return { json: { error: 'invalid_grant' }, status: 401 };
        });

        await signIn(page, baseURL);
        await expireSession(page);
        await openFirstEventEdit(page);
        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('alert')).toHaveText(SESSION_EXPIRED_ERROR);
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Edit event' })).toHaveCount(0);
        expect(await readSession(page)).toBeNull();
        expect(writes).toEqual([]);
        expect(mock.calls).toEqual([
            { authorization: '', body: `grant_type=password&username=${encodeURIComponent(ADMIN_EMAIL)}&password=correct-password`, method: 'POST', path: '/token' },
            { authorization: '', body: `grant_type=refresh_token&refresh_token=${TOKEN_RESPONSE.refresh_token}`, method: 'POST', path: '/token' },
        ]);
        expect(mock.unmatched).toEqual([]);
    });

    test('a refresh outage at save time keeps the session and the edit form without a bounce', async ({ baseURL, page }) => {
        const writes = await blockApiWrites(page);

        const mock = await mockIdentity(page, (call) => {
            if (call.method !== 'POST' || call.path !== '/token') return null;

            if (call.body.startsWith('grant_type=password')) return { json: TOKEN_RESPONSE, status: 200 };

            return { json: { code: 500, msg: 'Internal server error' }, status: 500 };
        });

        await signIn(page, baseURL);
        await expireSession(page);
        await openFirstEventEdit(page);
        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('status')).toHaveText('Failed to save');
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        await expect(page.getByText(SESSION_EXPIRED_ERROR)).toHaveCount(0);
        await expect(page.getByLabel('Email')).toHaveCount(0);

        const stored = await parseSession(page);

        expect(stored?.email).toBe(ADMIN_EMAIL);
        expect(stored?.refreshToken).toBe(TOKEN_RESPONSE.refresh_token);
        expect(writes).toEqual([]);
        expect(mock.calls).toEqual([
            { authorization: '', body: `grant_type=password&username=${encodeURIComponent(ADMIN_EMAIL)}&password=correct-password`, method: 'POST', path: '/token' },
            { authorization: '', body: `grant_type=refresh_token&refresh_token=${TOKEN_RESPONSE.refresh_token}`, method: 'POST', path: '/token' },
        ]);
        expect(mock.unmatched).toEqual([]);
    });

    test('an expired session while offline shows the offline toast instead of a login bounce', async ({ baseURL, context, page }) => {
        const writes = await blockApiWrites(page);

        const mock = await mockIdentity(page, (call) => {
            if (call.method !== 'POST' || call.path !== '/token') return null;

            if (call.body.startsWith('grant_type=password')) return { json: TOKEN_RESPONSE, status: 200 };

            return { json: { error: 'invalid_grant' }, status: 401 };
        });

        await signIn(page, baseURL);
        await expireSession(page);
        await openFirstEventEdit(page);

        await context.setOffline(true);
        await page.waitForFunction(() => navigator.onLine === false);

        await page.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByRole('status')).toHaveText(OFFLINE_ERROR);
        await expect(page.getByRole('heading', { name: 'Edit event' })).toBeVisible();
        await expect(page.getByText(SESSION_EXPIRED_ERROR)).toHaveCount(0);
        await expect(page.getByLabel('Email')).toHaveCount(0);
        expect(await readSession(page)).toBeNull();
        expect(writes).toEqual([]);
        expect(mock.calls).toHaveLength(2);
        expect(mock.unmatched).toEqual([]);

        await context.setOffline(false);
        await page.waitForFunction(() => navigator.onLine === true);
    });
});

test.describe('auth hash redirect', () => {
    test('redirects a recovery token hash on the home page to /admin with the hash preserved', async ({ page }) => {
        await page.goto('/#recovery_token=abc123');

        await expect(page).toHaveURL('/admin#recovery_token=abc123');
        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
    });

    test('redirects an invite token hash on an inner page to /admin with the hash preserved', async ({ page }) => {
        await page.goto('/events#invite_token=xyz');

        await expect(page).toHaveURL('/admin#invite_token=xyz');
        await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
    });

    test('leaves non-token and empty-token hashes on the original page', async ({ page }) => {
        await page.goto('/#contact');

        await expect(page).toHaveURL('/#contact');

        await page.goto('/events#recovery_token=');

        await expect(page).toHaveURL('/events#recovery_token=');
    });
});
