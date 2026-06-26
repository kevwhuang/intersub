import { Component } from 'react';

import { COBALT, FONT_HEADING, STYLES } from '@lib/constants';

export default class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
                <div style={{ maxWidth: 600 }}>
                    <p style={{ color: `color-mix(in srgb, ${COBALT} 18%, ${STYLES.colorSurface})`, fontFamily: FONT_HEADING, fontSize: 'clamp(120px, 20vw, 240px)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.8, margin: '0 0 16px' }} aria-hidden="true">
                        Error
                    </p>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: STYLES.colorMuted, fontSize: 'clamp(16px, 1.3vw, 20px)', lineHeight: 1.6, margin: '0 0 32px' }}>
                        An unexpected error occurred. Try refreshing the page or returning home.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        <button onClick={() => window.location.reload()} style={{ alignItems: 'center', background: COBALT, border: 'none', borderRadius: 10, color: STYLES.colorSurface, display: 'inline-flex', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, padding: '15px 24px' }}>
                            Refresh
                        </button>
                        <a href="/" style={{ alignItems: 'center', border: `1px solid ${STYLES.colorBorderHover}`, borderRadius: 10, color: STYLES.colorInk, display: 'inline-flex', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, padding: '15px 24px', textDecoration: 'none' }}>
                            Home
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
