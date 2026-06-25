import { useState } from 'react';

import { ACCENT, FONT_HEADING, STYLES } from '@lib/constants';
import { useAuth } from '@lib/authClient';

export default function SetPasswordScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [password, setPassword] = useState('');

    return (
        <div style={{ alignItems: 'center', background: '#f7f8fa', display: 'flex', fontFamily: '\'Hanken Grotesk\', sans-serif', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(24px, 5vw, 48px)' }}>
            <div style={{ maxWidth: 420, width: '100%' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                    <span style={{ background: ACCENT, borderRadius: 12, display: 'inline-block', height: 44, width: 44 }} />
                    <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>InterSub</span>
                </div>
                <div style={{ background: '#ffffff', border: STYLES.border, borderRadius: 18, boxShadow: '0 1px 3px #14161c0a, 0 10px 40px #14161c0f', padding: 'clamp(28px, 5vw, 40px) clamp(24px, 4vw, 36px)' }}>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px', textAlign: 'center' }}>Set your password</h1>
                    <p style={{ color: STYLES.colorGhost, fontSize: 14, lineHeight: 1.5, margin: '0 0 28px', textAlign: 'center' }}>Choose a password for your admin account.</p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            auth.handleSetPassword(password);
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                    >
                        <div>
                            <label htmlFor="dashboard-new-password" style={STYLES.labelBase}>New password</label>
                            <input className="dashboard-input" id="dashboard-new-password" value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="At least 8 characters" style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                        </div>
                        {auth.error && <p style={{ color: STYLES.colorError, fontSize: 13, margin: 0 }}>{auth.error}</p>}
                        <button className="dashboard-button--primary" type="submit" style={{ fontSize: 15, marginTop: 8, padding: '14px 0' }}>Set password</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
