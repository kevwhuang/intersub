import { afterEach, describe, expect, test, vi } from 'vitest';

import { verifyAuth } from '../../src/lib/authServer';

const IDENTITY_URL = 'https://identity.test';

function buildRequest(header?: string) {
    const headers = header ? { Authorization: header } : undefined;

    return new Request('http://localhost:8888/api/events', { headers });
}

async function importProduction(identityUrl: string) {
    vi.resetModules();
    vi.stubEnv('IDENTITY_URL', identityUrl);

    vi.doMock('../../src/lib/constants', async (importOriginal) => {
        const original = await importOriginal<typeof import('../../src/lib/constants')>();

        return { ...original, IS_DEV: false };
    });

    const module = await import('../../src/lib/authServer');

    return module.verifyAuth;
}

describe('verifyAuth', () => {
    afterEach(() => {
        vi.doUnmock('../../src/lib/constants');
        vi.resetModules();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    test('returns true in dev without an authorization header', async () => {
        await expect(verifyAuth(buildRequest())).resolves.toBe(true);
    });

    test('returns false in production without an authorization header', async () => {
        const verify = await importProduction(IDENTITY_URL);

        await expect(verify(buildRequest())).resolves.toBe(false);
    });

    test('returns false in production for a non-bearer header', async () => {
        const verify = await importProduction(IDENTITY_URL);

        await expect(verify(buildRequest('Basic abc123'))).resolves.toBe(false);
    });

    test('returns false in production without an identity url before fetching', async () => {
        const fetchStub = vi.fn();

        vi.stubGlobal('fetch', fetchStub);

        const verify = await importProduction('');

        await expect(verify(buildRequest('Bearer abc123'))).resolves.toBe(false);
        expect(fetchStub).not.toHaveBeenCalled();
    });

    test('returns true in production when the identity endpoint accepts the token', async () => {
        const fetchStub = vi.fn(async () => new Response(null, { status: 200 }));

        vi.stubGlobal('fetch', fetchStub);

        const verify = await importProduction(IDENTITY_URL);

        await expect(verify(buildRequest('Bearer abc123'))).resolves.toBe(true);

        expect(fetchStub).toHaveBeenCalledExactlyOnceWith(`${IDENTITY_URL}/user`, {
            headers: { Authorization: 'Bearer abc123' },
            signal: expect.any(AbortSignal),
        });
    });

    test('returns false in production when the identity endpoint rejects the token', async () => {
        const fetchStub = vi.fn(async () => new Response(null, { status: 401 }));

        vi.stubGlobal('fetch', fetchStub);

        const verify = await importProduction(IDENTITY_URL);

        await expect(verify(buildRequest('Bearer abc123'))).resolves.toBe(false);
    });

    test('returns false in production when the identity request throws', async () => {
        const fetchStub = vi.fn(async () => {
            throw new Error('network failure');
        });

        vi.stubGlobal('fetch', fetchStub);

        const verify = await importProduction(IDENTITY_URL);

        await expect(verify(buildRequest('Bearer abc123'))).resolves.toBe(false);
    });
});
