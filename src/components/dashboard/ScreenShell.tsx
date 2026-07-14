import { STYLES } from '@lib/constants';

export default function ScreenShell({ children, footer, subtitle, title }: {
    children: React.ReactNode;
    footer: React.ReactNode;
    subtitle?: string;
    title: string;
}) {
    return (
        <div style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(24px, calc(16px + 2.5vw), 48px)' }}>
            <div style={{ maxWidth: 420, width: '100%' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', marginBottom: 'clamp(32px, calc(26.67px + 1.67vw), 48px)' }}>
                    <img alt="InterSub" height="56" src="/apple-touch-icon.png" style={{ borderRadius: 14 }} width="56" />
                </div>
                <div style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 18, boxShadow: STYLES.shadowCard, marginBottom: 24, padding: 'clamp(28px, calc(24px + 1.25vw), 40px) clamp(24px, calc(20px + 1.25vw), 36px)' }}>
                    <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', margin: subtitle ? '0 0 6px' : '0 0 24px', textAlign: 'center' }}>{title}</h1>
                    {subtitle && <p style={{ color: STYLES.colorGhost, fontSize: 16, lineHeight: 1.5, margin: '0 0 28px', textAlign: 'center' }}>{subtitle}</p>}
                    {children}
                </div>
                {footer}
            </div>
        </div>
    );
}
