import { useState } from 'react';

import ScreenShell from '@components/dashboard/ScreenShell';
import Spinner from '@components/Spinner';
import { COBALT, PASSWORD_MAX, PASSWORD_MIN, STYLES, TOUCH_TARGET } from '@lib/constants';

import type { useAuth } from '@lib/authClient';

const ERROR_ID = 'error-set-password';

export default function ScreenSetPassword({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [password, setPassword] = useState('');

    function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        auth.handleSetPassword(password);
    }

    return (
        <ScreenShell
            footer={(
                <button
                    className="dashboard-link dashboard-link--hit"
                    onClick={auth.handleCancelSetPassword}
                    style={{ background: 'none', border: 'none', display: 'block', fontSize: 12, margin: '0 auto', textAlign: 'center' }}
                    type="button"
                >
                    &larr;
                    {' '}
                    {auth.user ? 'Back to dashboard' : 'Back to sign in'}
                </button>
            )}
            subtitle="Choose a password for your admin account."
            title="Set your password"
        >
            <form
                noValidate
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
                <label style={{ marginBottom: 8 }}>
                    <span style={STYLES.labelBase}>
                        New password
                        <span style={{ color: COBALT }}> *</span>
                    </span>
                    <input className="dashboard-input" aria-describedby={auth.error ? ERROR_ID : undefined} autoComplete="new-password" maxLength={PASSWORD_MAX} minLength={PASSWORD_MIN} onChange={event => setPassword(event.target.value)} placeholder={`${PASSWORD_MIN}\u2013${PASSWORD_MAX} characters`} style={STYLES.inputBase} type="password" value={password} />
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
                    aria-label="Set password"
                    disabled={auth.isPending}
                    style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', minHeight: TOUCH_TARGET, padding: '14px 0' }}
                    type="submit"
                >
                    {auth.isPending ? <Spinner /> : 'Set password'}
                </button>
            </form>
        </ScreenShell>
    );
}
