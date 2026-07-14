import { useState } from 'react';

import ScreenShell from '@components/dashboard/ScreenShell';
import Spinner from '@components/Spinner';
import { COBALT, PASSWORD_MIN, STYLES, TOUCH_TARGET } from '@lib/constants';

import type { useAuth } from '@lib/authClient';

const ERROR_ID = 'error-login';

export default function ScreenLogin({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        auth.handleLogin(email, password);
    }

    return (
        <ScreenShell
            footer={(
                <a
                    className="dashboard-link dashboard-link--hit"
                    href="/"
                    style={{ display: 'block', fontSize: 12, margin: '0 auto', width: 'fit-content' }}
                >
                    &larr; Back to site
                </a>
            )}
            title="Sign in"
        >
            <form
                noValidate
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
                <label>
                    <span style={STYLES.labelBase}>
                        Email
                        <span style={{ color: COBALT }}> *</span>
                    </span>
                    <input className="dashboard-input" aria-describedby={auth.error ? ERROR_ID : undefined} autoComplete="email" onChange={event => setEmail(event.target.value)} placeholder="you@example.com" style={STYLES.inputBase} type="email" value={email} />
                </label>
                <label style={{ marginBottom: 8 }}>
                    <span style={STYLES.labelBase}>
                        Password
                        <span style={{ color: COBALT }}> *</span>
                    </span>
                    <input className="dashboard-input" aria-describedby={auth.error ? ERROR_ID : undefined} autoComplete="current-password" onChange={event => setPassword(event.target.value)} placeholder={'\u2022'.repeat(PASSWORD_MIN)} style={STYLES.inputBase} type="password" value={password} />
                </label>
                {auth.error && (
                    <p
                        id={ERROR_ID}
                        role="alert"
                        style={STYLES.errorBase}
                    >
                        {auth.error}
                    </p>
                )}
                <button
                    className="dashboard-button dashboard-button--primary"
                    aria-label="Sign in"
                    disabled={auth.isPending}
                    style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', minHeight: TOUCH_TARGET, padding: '14px 0' }}
                    type="submit"
                >
                    {auth.isPending ? <Spinner /> : 'Sign in'}
                </button>
            </form>
        </ScreenShell>
    );
}
