import { useEffect, useState } from 'react';

const BYPASS_AUTH = true;

const IS_LOCAL = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SKIP_AUTH = IS_LOCAL || BYPASS_AUTH;

export interface AuthUser {
    email?: string;
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(SKIP_AUTH ? { email: 'dev@localhost' } : null);
    const [loading, setLoading] = useState(!SKIP_AUTH);
    const [error, setError] = useState('');

    useEffect(() => {
        if (SKIP_AUTH) return;

        let unsubscribe: (() => void) | undefined;

        (async () => {
            const identity = await import('@netlify/identity');
            await identity.handleAuthCallback();
            setUser(await identity.getUser());
            setLoading(false);
            unsubscribe = identity.onAuthChange((_event, currentUser) => setUser(currentUser));
        })();

        return () => unsubscribe?.();
    }, []);

    async function handleLogin(email: string, password: string) {
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Enter your email and password.');
            return;
        }

        if (SKIP_AUTH) {
            setUser({ email });
            return;
        }

        try {
            const identity = await import('@netlify/identity');
            const loggedIn = await identity.login(email, password);
            setUser(loggedIn);
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
            const identity = await import('@netlify/identity');
            await identity.logout();
        } finally {
            setUser(null);
        }
    }

    return { error, handleLogin, handleLogout, loading, user };
}
