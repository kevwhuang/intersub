import { useState } from 'react';

import { COBALT, FONT_HEADING, STYLES } from '@lib/constants';
import { useAuth } from '@lib/authClient';

export default function SetPasswordScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [password, setPassword] = useState('');

    return (
        <div style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(24px, 5vw, 48px)' }}>
            <div style={{ maxWidth: 420, width: '100%' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                    <span style={{ background: COBALT, borderRadius: 12, display: 'inline-block', height: 44, width: 44 }} />
                    <span style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>InterSub</span>
                </div>
                <div style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 18, boxShadow: STYLES.shadowCard, padding: 'clamp(28px, 5vw, 40px) clamp(24px, 4vw, 36px)' }}>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px', textAlign: 'center' }}>Set your password</h1>
                    <p style={{ color: STYLES.colorGhost, fontSize: 16, lineHeight: 1.5, margin: '0 0 28px', textAlign: 'center' }}>Choose a password for your admin account.</p>
                    <form
                        noValidate
                        onSubmit={(event) => {
                            event.preventDefault();
                            auth.handleSetPassword(password);
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                    >
                        <label>
                            <span style={STYLES.labelBase}>New password</span>
                            <input className="dashboard-input" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="At least 8 characters" style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                        </label>
                        {auth.error && <p style={{ color: STYLES.colorError, fontSize: 12, margin: 0 }}>{auth.error}</p>}
                        <button className="dashboard-button--primary" disabled={auth.loading} type="submit" style={{ fontSize: 16, marginTop: 8, padding: '14px 0' }}>Set password</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
