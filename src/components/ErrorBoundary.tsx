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
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(48px, calc(30.67px + 5.42vw), 100px) 0' }}>
                <div style={{ margin: '0 auto', maxWidth: 620, padding: '0 var(--shell-pad)', textAlign: 'center', width: '100%' }}>
                    <p aria-hidden="true" style={{ color: `color-mix(in srgb, ${COBALT} 18%, ${STYLES.colorSurface})`, fontFamily: FONT_HEADING, fontSize: 'clamp(120px, calc(80px + 12.5vw), 240px)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.8, margin: '0 0 clamp(24px, calc(18.67px + 1.67vw), 40px)', userSelect: 'none' }}>
                        Error
                    </p>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, calc(18.67px + 1.67vw), 40px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: STYLES.colorMuted, fontSize: 16, lineHeight: 1.6, margin: '0 0 32px' }}>
                        Try refreshing the page or returning home.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <a className="button" href="/">
                            Go home
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
