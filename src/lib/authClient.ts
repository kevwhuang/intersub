import { useEffect, useState } from 'react';

import { AUTH_TOKEN_PATTERN, ERROR_GENERIC, PASSWORD_MAX, PASSWORD_MIN } from '@lib/constants';

interface AuthUser {
    email?: string;
}

interface TokenResponse {
    access_token: string;
    email?: string;
    expires_in: number;
    refresh_token: string;
}

const AUTH_KEY = 'intersub_auth';
const ERROR_INVALID_LINK = 'This link is invalid or has expired.';
const ERROR_SESSION_EXPIRED = 'Session expired. Please sign in again.';
const EXPIRY_BUFFER = 60_000;
const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' } as const;

const IDENTITY_URL = typeof window !== 'undefined'
    ? `${window.location.origin}/.netlify/identity`
    : '';

const IS_LOCAL = import.meta.env.DEV
    && typeof window !== 'undefined'
    && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');

let refreshPromise: Promise<StoredSession | null> | null = null;

function clearSession() {
    localStorage.removeItem(AUTH_KEY);
}

async function createSession(data: TokenResponse): Promise<AuthUser | null> {
    if (!data.access_token) return null;

    const email = data.email ?? await fetchUserEmail(data.access_token);

    storeSession(data, email);

    return { email };
}

async function fetchIdentity(path: string, options: RequestInit) {
    return fetch(`${IDENTITY_URL}${path}`, options);
}

async function fetchUserEmail(accessToken: string): Promise<string> {
    try {
        const response = await fetchIdentity('/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
            method: 'GET',
        });

        if (!response.ok) return '';

        const data = await response.json();

        return data.email ?? '';
    } catch {
        return '';
    }
}

function loadSession(): StoredSession | null {
    try {
        const raw = localStorage.getItem(AUTH_KEY);

        if (!raw) return null;

        const parsed = JSON.parse(raw);

        if (parsed.accessToken && parsed.refreshToken && typeof parsed.email === 'string') return parsed;
    } catch {
        return null;
    }

    return null;
}

function parseAuthHash() {
    const match = window.location.hash.match(AUTH_TOKEN_PATTERN);

    if (!match) return null;

    return { kind: match[1], token: match[2] };
}

async function refreshSession(): Promise<StoredSession | null> {
    const stored = loadSession();

    if (!stored) return null;

    try {
        const response = await fetchIdentity('/token', {
            body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(stored.refreshToken)}`,
            headers: FORM_HEADERS,
            method: 'POST',
        });

        if (response.ok) {
            const data = await response.json();

            const current = loadSession();

            if (!current || current.refreshToken !== stored.refreshToken) return current;

            storeSession(data, stored.email);

            return loadSession();
        }

        if (response.status === 400 || response.status === 401) {
            const current = loadSession();

            if (current && current.refreshToken !== stored.refreshToken) return current;

            clearSession();
        }

        return null;
    } catch {
        return null;
    }
}

async function resolveSession(): Promise<{ email: string; token: string } | null> {
    const stored = loadSession();

    if (!stored) return null;

    if (stored.expiresAt > Date.now() + EXPIRY_BUFFER) return { email: stored.email, token: stored.accessToken };

    refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null;
    });

    const refreshed = await refreshPromise;

    if (refreshed) return { email: refreshed.email, token: refreshed.accessToken };

    const current = loadSession();

    if (current && current.expiresAt > Date.now()) return { email: current.email, token: current.accessToken };

    return null;
}

function storeSession(data: TokenResponse, email: string) {
    const session: StoredSession = {
        accessToken: data.access_token,
        email,
        expiresAt: Date.now() + data.expires_in * 1_000,
        refreshToken: data.refresh_token,
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

async function verifyToken(body: Record<string, string>): Promise<AuthUser | null> {
    const response = await fetchIdentity('/verify', {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });

    if (!response.ok) return null;

    return createSession(await response.json());
}

export function useAuth() {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(!IS_LOCAL);
    const [isPending, setIsPending] = useState(false);
    const [isRecovery, setIsRecovery] = useState(false);
    const [pendingInvite, setPendingInvite] = useState('');
    const [user, setUser] = useState<AuthUser | null>(IS_LOCAL ? { email: 'dev@localhost' } : null);

    async function getToken(): Promise<string | null> {
        if (IS_LOCAL) return 'dev-token';

        const session = await resolveSession();

        return session?.token ?? null;
    }

    function handleCancelSetPassword() {
        setError('');
        setPendingInvite('');
        setIsRecovery(false);
    }

    async function handleLogin(email: string, password: string) {
        if (isPending) return;

        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');

            return;
        }

        if (IS_LOCAL) {
            setUser({ email });

            return;
        }

        setIsPending(true);

        try {
            const response = await fetchIdentity('/token', {
                body: `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
                headers: FORM_HEADERS,
                method: 'POST',
            });

            if (!response.ok) {
                setError(response.status === 400 || response.status === 401
                    ? 'Invalid email or password.'
                    : ERROR_GENERIC);

                return;
            }

            const data = await response.json();

            storeSession(data, email);
            setUser({ email });
        } catch {
            setError(ERROR_GENERIC);
        } finally {
            setIsPending(false);
        }
    }

    function handleLogout() {
        clearSession();
        setError('');
        setUser(null);
    }

    function handleSessionExpired() {
        if (loadSession()) return;

        setError(ERROR_SESSION_EXPIRED);
        setUser(null);
    }

    async function handleSetPassword(password: string) {
        if (isPending) return;

        setError('');

        if (!password.trim() || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
            setError('Password must be 8\u201320 characters.');

            return;
        }

        setIsPending(true);

        try {
            if (pendingInvite) {
                const verified = await verifyToken({ password, token: pendingInvite, type: 'signup' });

                if (!verified) {
                    setError('This invite link is invalid or has expired.');

                    return;
                }

                setPendingInvite('');
                setIsRecovery(false);
                setUser(verified);

                return;
            }

            const session = await resolveSession();

            if (!session) {
                setError(ERROR_SESSION_EXPIRED);
                setUser(null);

                return;
            }

            const response = await fetchIdentity('/user', {
                body: JSON.stringify({ password }),
                headers: {
                    'Authorization': `Bearer ${session.token}`,
                    'Content-Type': 'application/json',
                },
                method: 'PUT',
            });

            if (!response.ok) {
                setError('Failed to set password.');

                return;
            }

            setIsRecovery(false);
        } catch {
            setError(ERROR_GENERIC);
        } finally {
            setIsPending(false);
        }
    }

    async function initAuth() {
        if (IS_LOCAL) return;

        try {
            const authHash = parseAuthHash();

            if (authHash) {
                history.replaceState(history.state, '', window.location.pathname + window.location.search);

                if (authHash.kind === 'invite') {
                    const probe = await fetchIdentity('/verify', {
                        body: JSON.stringify({ token: authHash.token, type: 'signup' }),
                        headers: { 'Content-Type': 'application/json' },
                        method: 'POST',
                    });

                    if (probe.ok) {
                        const invited = await createSession(await probe.json());

                        if (invited) {
                            setIsRecovery(true);
                            setUser(invited);

                            return;
                        }
                    } else if (probe.status !== 404) {
                        setPendingInvite(authHash.token);
                        setIsRecovery(true);

                        return;
                    }

                    setError(ERROR_INVALID_LINK);
                } else {
                    const verified = await verifyToken({ token: authHash.token, type: authHash.kind === 'recovery' ? 'recovery' : 'signup' });

                    if (verified) {
                        if (authHash.kind === 'recovery') setIsRecovery(true);

                        setUser(verified);

                        return;
                    }

                    setError(ERROR_INVALID_LINK);
                }
            }

            const session = await resolveSession();

            if (session) setUser({ email: session.email });
        } catch {
            setError(ERROR_GENERIC);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        initAuth();
    }, []);

    return { error, getToken, handleCancelSetPassword, handleLogin, handleLogout, handleSessionExpired, handleSetPassword, isLoading, isPending, isRecovery, user };
}
