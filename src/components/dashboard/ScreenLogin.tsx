import { useState } from 'react';

import Spinner from '@components/Spinner';
import { STYLES } from '@lib/constants';
import { useAuth } from '@lib/authClient';

export default function ScreenLogin({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        auth.handleLogin(email, password);
    }

    return (
        <div style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(24px, calc(16px + 2.5vw), 48px)' }}>
            <div style={{ maxWidth: 420, width: '100%' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'clamp(32px, calc(26.67px + 1.67vw), 48px)' }}>
                    <img alt="InterSub" height="56" src="/apple-touch-icon.png" style={{ borderRadius: 14 }} width="56" />
                </div>
                <div style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 18, boxShadow: STYLES.shadowCard, padding: 'clamp(28px, calc(24px + 1.25vw), 40px) clamp(24px, calc(20px + 1.25vw), 36px)' }}>
                    <form
                        noValidate
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                    >
                        <label>
                            <span style={STYLES.labelBase}>Email</span>
                            <input className="dashboard-input" autoComplete="email" onChange={event => setEmail(event.target.value)} placeholder="you@example.com" style={STYLES.inputBase} type="email" value={email} />
                        </label>
                        <label>
                            <span style={STYLES.labelBase}>Password</span>
                            <input className="dashboard-input" autoComplete="current-password" onChange={event => setPassword(event.target.value)} placeholder={'\u2022'.repeat(8)} style={STYLES.inputBase} type="password" value={password} />
                        </label>
                        {auth.error && <p role="alert" style={{ color: STYLES.colorError, fontSize: 12, margin: 0 }}>{auth.error}</p>}
                        <button className="dashboard-button dashboard-button--primary" aria-label="Sign in" disabled={auth.isPending} style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', marginTop: 8, minHeight: 47, padding: '14px 0' }} type="submit">
                            {auth.isPending ? <Spinner /> : 'Sign in'}
                        </button>
                    </form>
                </div>
                <a className="dashboard-link" href="/" style={{ display: 'block', fontSize: 12, margin: '24px auto 0', width: 'fit-content' }}>&larr; Back to site</a>
            </div>
        </div>
    );
}
