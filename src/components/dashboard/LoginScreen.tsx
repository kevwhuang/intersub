import { useState } from 'react';

import Spinner from '@components/Spinner';
import { FONT_HEADING, STYLES } from '@lib/constants';
import { useAuth } from '@lib/authClient';

export default function LoginScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
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
                    <img alt="InterSub" height="44" src="/favicon.png" style={{ borderRadius: 12 }} width="44" />
                </div>
                <div style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 18, boxShadow: STYLES.shadowCard, padding: 'clamp(28px, calc(24px + 1.25vw), 40px) clamp(24px, calc(20px + 1.25vw), 36px)' }}>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px', textAlign: 'center' }}>Sign in</h1>
                    <p style={{ color: STYLES.colorGhost, fontSize: 16, lineHeight: 1.5, margin: '0 0 28px', textAlign: 'center' }}>Admin access only.</p>
                    <form
                        noValidate
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                    >
                        <label>
                            <span style={STYLES.labelBase}>Email</span>
                            <input className="dashboard-input" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="you@example.com" style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                        </label>
                        <label>
                            <span style={STYLES.labelBase}>Password</span>
                            <input className="dashboard-input" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder={'\u2022'.repeat(8)} style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                        </label>
                        {auth.error && <p role="alert" style={{ color: STYLES.colorError, fontSize: 12, margin: 0 }}>{auth.error}</p>}
                        <button className="dashboard-button dashboard-button--primary" disabled={auth.isPending} type="submit" style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', marginTop: 8, minHeight: 47, padding: '14px 0' }}>
                            {auth.isPending ? <Spinner /> : 'Sign in'}
                        </button>
                    </form>
                </div>
                <a className="dashboard-link" href="/" style={{ color: STYLES.colorGhost, display: 'block', fontSize: 12, marginTop: 24, textAlign: 'center' }}>&larr; Back to site</a>
            </div>
        </div>
    );
}
