import { useEffect, useState } from 'react';

interface AuthUser {
    email?: string;
}

const BYPASS_AUTH = true;

const IS_LOCAL = typeof window !== 'undefined'
    && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');

const SKIP_AUTH = BYPASS_AUTH || IS_LOCAL;

async function loadIdentity() {
    return import('@netlify/identity');
}

export function useAuth() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(!SKIP_AUTH);
    const [user, setUser] = useState<AuthUser | null>(SKIP_AUTH ? { email: 'dev@localhost' } : null);

    useEffect(() => {
        if (SKIP_AUTH) return;

        let unsubscribe: (() => void) | undefined;

        (async () => {
            const identity = await loadIdentity();
            await identity.handleAuthCallback();
            setUser(await identity.getUser());
            setLoading(false);
            unsubscribe = identity.onAuthChange((_event, currentUser) => setUser(currentUser));
        })();

        return () => unsubscribe?.();
    }, []);

    async function getToken(): Promise<string | null> {
        if (SKIP_AUTH) return 'dev-token';

        try {
            const identity = await loadIdentity();
            const current = await identity.getUser() as Record<string, Record<string, string>> | null;
            return current?.token?.access_token ?? null;
        } catch {
            return null;
        }
    }

    async function handleLogin(email: string, password: string) {
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
        }

        if (SKIP_AUTH) {
            setUser({ email });
            return;
        }

        try {
            const identity = await loadIdentity();
            setUser(await identity.login(email, password));
        } catch {
            setError('Invalid email or password.');
        }
    }

    async function handleLogout() {
        if (SKIP_AUTH) {
            setUser(null);
            return;
        }

        try {
            const identity = await loadIdentity();
            await identity.logout();
        } finally {
            setUser(null);
        }
    }

    return { error, getToken, handleLogin, handleLogout, loading, user };
}
