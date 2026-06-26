import { useEffect, useState } from 'react';

interface AuthUser {
    email?: string;
}

interface StoredSession {
    accessToken: string;
    email: string;
    expiresAt: number;
    refreshToken: string;
}

interface TokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
}

const AUTH_KEY = 'intersub_auth';
const EXPIRY_BUFFER = 60_000;

const IDENTITY_URL = typeof window !== 'undefined'
    ? `${window.location.origin}/.netlify/identity`
    : '';
const IS_LOCAL = typeof window !== 'undefined'
    && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');

function storeSession(data: TokenResponse, email: string) {
    const session: StoredSession = {
        accessToken: data.access_token,
        email,
        expiresAt: Date.now() + data.expires_in * 1_000,
        refreshToken: data.refresh_token,
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

function loadSession(): StoredSession | null {
    try {
        const raw = localStorage.getItem(AUTH_KEY);

        if (!raw) return null;

        const parsed = JSON.parse(raw);

        if (parsed.accessToken && parsed.refreshToken && parsed.email) return parsed;
    } catch {
        return null;
    }

    return null;
}

function clearSession() {
    localStorage.removeItem(AUTH_KEY);
}

async function fetchIdentity(path: string, options: RequestInit) {
    return fetch(`${IDENTITY_URL}${path}`, options);
}

async function refreshToken(token: string): Promise<TokenResponse | null> {
    try {
        const response = await fetchIdentity('/token', {
            body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(token)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            method: 'POST',
        });

        if (!response.ok) return null;

        return response.json();
    } catch {
        return null;
    }
}

async function resolveSession(): Promise<{ email: string; token: string } | null> {
    const stored = loadSession();

    if (!stored) return null;

    if (stored.expiresAt > Date.now() + EXPIRY_BUFFER) return { email: stored.email, token: stored.accessToken };

    const refreshed = await refreshToken(stored.refreshToken);

    if (refreshed) {
        storeSession(refreshed, stored.email);

        return { email: stored.email, token: refreshed.access_token };
    }

    clearSession();

    return null;
}

async function processHashToken(): Promise<AuthUser | null> {
    const hash = window.location.hash;

    const confirmMatch = hash.match(/confirmation_token=([^&]+)/);
    const inviteMatch = hash.match(/invite_token=([^&]+)/);
    const recoveryMatch = hash.match(/recovery_token=([^&]+)/);

    const token = recoveryMatch?.[1] ?? inviteMatch?.[1] ?? confirmMatch?.[1];
    const type = recoveryMatch ? 'recovery' : inviteMatch ? 'invite' : confirmMatch ? 'signup' : null;

    if (!token || !type) return null;

    try {
        const response = await fetchIdentity('/verify', {
            body: JSON.stringify({ token, type }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });

        if (!response.ok) return null;

        const data = await response.json();

        window.location.hash = '';

        if (data.access_token) {
            storeSession(data, data.email ?? '');

            return { email: data.email };
        }

        return null;
    } catch {
        return null;
    }
}

export function useAuth() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(!IS_LOCAL);
    const [recovery, setRecovery] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(IS_LOCAL ? { email: 'dev@localhost' } : null);

    async function getToken(): Promise<string | null> {
        if (IS_LOCAL) return 'dev-token';

        const session = await resolveSession();

        return session?.token ?? null;
    }

    async function handleLogin(email: string, password: string) {
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
        }

        if (IS_LOCAL) {
            setUser({ email });
            return;
        }

        try {
            const response = await fetchIdentity('/token', {
                body: `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                method: 'POST',
            });

            if (!response.ok) {
                setError('Invalid email or password.');
                return;
            }

            const data = await response.json();

            storeSession(data, email);
            setUser({ email });
        } catch {
            setError('Invalid email or password.');
        }
    }

    async function handleSetPassword(password: string) {
        setError('');

        if (!password.trim() || password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        const session = await resolveSession();

        if (!session) {
            setError('Session expired. Please log in again.');
            setUser(null);
            return;
        }

        try {
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

            setRecovery(false);
            window.location.hash = '';
        } catch {
            setError('Failed to set password.');
        }
    }

    async function handleLogout() {
        clearSession();
        setUser(null);
    }

    async function initAuth() {
        if (IS_LOCAL) return;

        try {
            const hash = window.location.hash;

            const isRecovery = hash.includes('recovery_token') || hash.includes('invite_token');

            const hashUser = await processHashToken();

            if (hashUser) {
                if (isRecovery) setRecovery(true);

                setUser(hashUser);

                return;
            }

            const session = await resolveSession();

            if (session) setUser({ email: session.email });
        } catch {
            clearSession();
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        initAuth();
    }, []);

    return { error, getToken, handleLogin, handleLogout, handleSetPassword, loading, recovery, user };
}
