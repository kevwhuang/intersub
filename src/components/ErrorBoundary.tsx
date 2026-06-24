import { Component } from 'react';

const FONT_HEADING = '\'Space Grotesk\', system-ui, sans-serif';

export class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{ alignItems: 'center', display: 'flex', fontFamily: '\'Hanken Grotesk\', system-ui, sans-serif', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
                <div style={{ maxWidth: 600 }}>
                    <p style={{ color: 'color-mix(in srgb, #2a52e0 18%, #fff)', fontFamily: FONT_HEADING, fontSize: 'clamp(120px, 20vw, 240px)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.8, margin: '0 0 16px' }} aria-hidden="true">
                        Error
                    </p>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: '#4a515e', fontSize: 'clamp(16px, 1.3vw, 18px)', lineHeight: 1.6, margin: '0 0 32px' }}>
                        An unexpected error occurred. Try refreshing the page or returning home.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        <button onClick={() => window.location.reload()} style={{ alignItems: 'center', background: '#2a52e0', border: 'none', borderRadius: 10, color: '#ffffff', cursor: 'pointer', display: 'inline-flex', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, padding: '15px 24px' }}>
                            Refresh
                        </button>
                        <a href="/" style={{ alignItems: 'center', border: '1px solid #d4d8e0', borderRadius: 10, color: '#14161c', display: 'inline-flex', fontFamily: 'inherit', fontSize: 16, fontWeight: 600, padding: '15px 24px', textDecoration: 'none' }}>
                            Home
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
