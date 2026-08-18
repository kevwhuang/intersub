import { afterEach, describe, expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PASSWORD_MAX, PASSWORD_MIN } from '../../src/lib/constants';

type FetchStub = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => ReturnType<typeof fetch>;

interface SessionPayload {
    accessToken: string;
    email: string;
    expiresAt: number;
    refreshToken: string;
}

const AUTH_KEY = 'intersub_auth';
const EXPIRY_BUFFER = 60_000;

const INVALID_PAYLOADS = [
    { label: 'is not json', raw: '{"accessToken":' },
    { label: 'has no access token', raw: JSON.stringify({ email: 'user@example.com', refreshToken: 'stored-refresh' }) },
    { label: 'has no refresh token', raw: JSON.stringify({ accessToken: 'stored-access', email: 'user@example.com' }) },
    { label: 'has a non-string email', raw: JSON.stringify({ accessToken: 'stored-access', email: 7, refreshToken: 'stored-refresh' }) },
] as const;

const OUT_OF_RANGE_PASSWORDS = [
    { label: 'one character below the minimum', password: 'a'.repeat(PASSWORD_MIN - 1) },
    { label: 'one character above the maximum', password: 'a'.repeat(PASSWORD_MAX + 1) },
] as const;

function buildResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status });
}

function buildSession(overrides: Partial<SessionPayload> = {}): SessionPayload {
    return {
        accessToken: 'stored-access',
        email: 'user@example.com',
        expiresAt: 0,
        refreshToken: 'stored-refresh',
        ...overrides,
    };
}

function buildStorage() {
    const entries = new Map<string, string>();

    return {
        getItem: vi.fn((key: string) => entries.get(key) ?? null),
        removeItem: vi.fn((key: string) => {
            entries.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
            entries.set(key, value);
        }),
    };
}

function buildTokenResponse() {
    return { access_token: 'granted-access', expires_in: 3_600, refresh_token: 'granted-refresh' };
}

function getStored(storage: ReturnType<typeof buildStorage>) {
    const raw = storage.getItem(AUTH_KEY);

    return raw ? JSON.parse(raw) as SessionPayload : null;
}

async function loadAuth(fetchImpl?: FetchStub) {
    vi.resetModules();

    const fetchStub = vi.fn(fetchImpl);
    const storage = buildStorage();

    vi.stubGlobal('fetch', fetchStub);
    vi.stubGlobal('localStorage', storage);

    const { useAuth } = await import('../../src/lib/authClient');

    let auth!: ReturnType<typeof useAuth>;

    renderToStaticMarkup(createElement(() => {
        auth = useAuth();

        return null;
    }));

    return { auth, fetchStub, storage };
}

afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
});

describe('getToken', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test('resolves null without a stored session', async () => {
        const { auth, fetchStub } = await loadAuth();

        await expect(auth.getToken()).resolves.toBeNull();

        expect(fetchStub).not.toHaveBeenCalled();
    });

    for (const { label, raw } of INVALID_PAYLOADS) {
        test(`resolves null when the stored payload ${label}`, async () => {
            const { auth, fetchStub, storage } = await loadAuth();

            storage.setItem(AUTH_KEY, raw);

            await expect(auth.getToken()).resolves.toBeNull();

            expect(fetchStub).not.toHaveBeenCalled();
        });
    }

    test('serves the stored token without fetching until expiry enters the refresh buffer', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);

        const granted = buildTokenResponse();
        const session = buildSession({ expiresAt: EXPIRY_BUFFER + 2 });

        const { auth, fetchStub, storage } = await loadAuth(async () => buildResponse(granted));

        storage.setItem(AUTH_KEY, JSON.stringify(session));

        vi.advanceTimersByTime(1);

        await expect(auth.getToken()).resolves.toBe(session.accessToken);

        expect(fetchStub).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);

        await expect(auth.getToken()).resolves.toBe(granted.access_token);

        expect(fetchStub).toHaveBeenCalledTimes(1);
    });

    test('posts a refresh grant for an expired session and rewrites the stored payload', async () => {
        const granted = buildTokenResponse();
        const session = buildSession({ refreshToken: 'stored/refresh+1' });

        const { auth, fetchStub, storage } = await loadAuth(async () => buildResponse(granted));

        storage.setItem(AUTH_KEY, JSON.stringify(session));

        await expect(auth.getToken()).resolves.toBe(granted.access_token);

        expect(fetchStub).toHaveBeenCalledExactlyOnceWith('/token', {
            body: 'grant_type=refresh_token&refresh_token=stored%2Frefresh%2B1',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            method: 'POST',
        });

        const stored = getStored(storage);

        expect(stored).toEqual({
            accessToken: granted.access_token,
            email: session.email,
            expiresAt: expect.any(Number),
            refreshToken: granted.refresh_token,
        });

        expect(stored?.expiresAt).toBeGreaterThan(Date.now());
    });

    test('removes the stored session when the refresh returns unauthorized', async () => {
        const { auth, storage } = await loadAuth(async () => buildResponse({}, 401));

        storage.setItem(AUTH_KEY, JSON.stringify(buildSession()));

        await expect(auth.getToken()).resolves.toBeNull();

        expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith(AUTH_KEY);
        expect(getStored(storage)).toBeNull();
    });

    test('keeps the stored session when the refresh request rejects', async () => {
        const { auth, storage } = await loadAuth(async () => {
            throw new Error('network down');
        });

        const raw = JSON.stringify(buildSession());

        storage.setItem(AUTH_KEY, raw);

        await expect(auth.getToken()).resolves.toBeNull();

        expect(storage.getItem(AUTH_KEY)).toBe(raw);
        expect(storage.removeItem).not.toHaveBeenCalled();
    });

    test('issues one token request for two concurrent calls on an expired session', async () => {
        const granted = buildTokenResponse();

        let releaseRefresh!: () => void;

        const gate = new Promise<void>((resolve) => {
            releaseRefresh = resolve;
        });

        const { auth, fetchStub, storage } = await loadAuth(async () => {
            await gate;

            return buildResponse(granted);
        });

        storage.setItem(AUTH_KEY, JSON.stringify(buildSession()));

        const tokens = [auth.getToken(), auth.getToken()];

        releaseRefresh();

        await expect(Promise.all(tokens)).resolves.toEqual([granted.access_token, granted.access_token]);

        expect(fetchStub).toHaveBeenCalledTimes(1);
    });
});

describe('handleLogin', () => {
    test('issues no fetch when email and password are empty', async () => {
        const { auth, fetchStub, storage } = await loadAuth();

        await auth.handleLogin('', '');

        expect(fetchStub).not.toHaveBeenCalled();
        expect(storage.setItem).not.toHaveBeenCalled();
    });

    test('posts a password grant and stores the granted access token', async () => {
        const granted = buildTokenResponse();

        const { auth, fetchStub, storage } = await loadAuth(async () => buildResponse(granted));

        await auth.handleLogin('user@example.com', 'p@ss word');

        expect(fetchStub).toHaveBeenCalledExactlyOnceWith('/token', {
            body: 'grant_type=password&username=user%40example.com&password=p%40ss%20word',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            method: 'POST',
        });

        expect(getStored(storage)).toEqual({
            accessToken: granted.access_token,
            email: 'user@example.com',
            expiresAt: expect.any(Number),
            refreshToken: granted.refresh_token,
        });
    });

    test('leaves storage without a session when the login is rejected', async () => {
        const { auth, storage } = await loadAuth(async () => buildResponse({}, 401));

        await auth.handleLogin('user@example.com', 'wrong-password');

        expect(storage.setItem).not.toHaveBeenCalled();
        expect(getStored(storage)).toBeNull();
    });
});

describe('handleLogout', () => {
    test('removes the stored session key', async () => {
        const { auth, storage } = await loadAuth();

        storage.setItem(AUTH_KEY, JSON.stringify(buildSession()));

        auth.handleLogout();

        expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith(AUTH_KEY);
        expect(getStored(storage)).toBeNull();
    });
});

describe('handleSetPassword', () => {
    for (const { label, password } of OUT_OF_RANGE_PASSWORDS) {
        test(`issues no fetch for a password ${label}`, async () => {
            const { auth, fetchStub } = await loadAuth();

            await auth.handleSetPassword(password);

            expect(fetchStub).not.toHaveBeenCalled();
        });
    }
});
