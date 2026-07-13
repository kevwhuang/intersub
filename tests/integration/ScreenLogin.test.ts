import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import ScreenLogin from '../../src/components/dashboard/ScreenLogin';

type AuthProp = Parameters<typeof ScreenLogin>[0]['auth'];

function renderScreen(overrides: Partial<AuthProp> = {}) {
    const auth: AuthProp = {
        error: '',
        getToken: vi.fn(),
        handleCancelSetPassword: vi.fn(),
        handleLogin: vi.fn(),
        handleLogout: vi.fn(),
        handleSessionExpired: vi.fn(),
        handleSetPassword: vi.fn(),
        isLoading: false,
        isPending: false,
        isRecovery: false,
        user: null,
        ...overrides,
    };

    return renderToStaticMarkup(createElement(ScreenLogin, { auth }));
}

describe('ScreenLogin', () => {
    test('renders the email field', () => {
        const html = renderScreen();

        expect(html).toContain('>Email</span>');
        expect(html).toContain('type="email"');
        expect(html).toContain('autoComplete="email"');
        expect(html).toContain('placeholder="you@example.com"');
    });

    test('renders the password field', () => {
        const html = renderScreen();

        expect(html).toContain('>Password</span>');
        expect(html).toContain('type="password"');
        expect(html).toContain('autoComplete="current-password"');
        expect(html).toContain(`placeholder="${'\u2022'.repeat(8)}"`);
    });

    test('renders the sign-in submit button', () => {
        const html = renderScreen();

        expect(html).toContain('aria-label="Sign in"');
        expect(html).toContain('type="submit"');
        expect(html).toContain('>Sign in</button>');
        expect(html).not.toContain('disabled=""');
    });

    test('renders the error message when auth reports one', () => {
        const html = renderScreen({ error: 'Invalid email or password.' });

        expect(html).toContain('role="alert"');
        expect(html).toContain('Invalid email or password.');
    });

    test('omits the error element by default', () => {
        const html = renderScreen();

        expect(html).not.toContain('role="alert"');
    });

    test('disables the button and shows a spinner while pending', () => {
        const html = renderScreen({ isPending: true });

        expect(html).toContain('disabled=""');
        expect(html).toContain('dashboard__spin');
        expect(html).not.toContain('>Sign in</button>');
    });

    test('brands the screen and links back to the site', () => {
        const html = renderScreen();

        expect(html).toContain('alt="InterSub"');
        expect(html).toContain('src="/apple-touch-icon.png"');
        expect(html).toContain('href="/"');
        expect(html).toContain('Back to site');
    });
});
