import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import ScreenSetPassword from '../../src/components/dashboard/ScreenSetPassword';

type AuthProp = Parameters<typeof ScreenSetPassword>[0]['auth'];

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
        isRecovery: true,
        user: null,
        ...overrides,
    };

    return renderToStaticMarkup(createElement(ScreenSetPassword, { auth }));
}

describe('ScreenSetPassword', () => {
    test('renders the heading and helper copy', () => {
        const html = renderScreen();

        expect(html).toContain('Set your password</h1>');
        expect(html).toContain('Choose a password for your admin account.');
    });

    test('documents the password rules on the field', () => {
        const html = renderScreen();

        expect(html).toContain('>New password</span>');
        expect(html).toContain('type="password"');
        expect(html).toContain('minLength="8"');
        expect(html).toContain('maxLength="20"');
        expect(html).toContain('placeholder="8\u201320 characters"');
        expect(html).toContain('autoComplete="new-password"');
    });

    test('renders the set-password submit button', () => {
        const html = renderScreen();

        expect(html).toContain('aria-label="Set password"');
        expect(html).toContain('type="submit"');
        expect(html).toContain('>Set password</button>');
    });

    test('renders the error message when auth reports one', () => {
        const html = renderScreen({ error: 'Password must be 8\u201320 characters.' });

        expect(html).toContain('role="alert"');
        expect(html).toContain('Password must be 8\u201320 characters.');
    });

    test('omits the error element by default', () => {
        const html = renderScreen();

        expect(html).not.toContain('role="alert"');
    });

    test('disables the button and shows a spinner while pending', () => {
        const html = renderScreen({ isPending: true });

        expect(html).toContain('disabled=""');
        expect(html).toContain('dashboard__spin');
        expect(html).not.toContain('>Set password</button>');
    });

    test('offers a way back to sign in when signed out', () => {
        const html = renderScreen();

        expect(html).toContain('Back to sign in');
        expect(html).not.toContain('Back to dashboard');
    });

    test('offers a way back to the dashboard when signed in', () => {
        const html = renderScreen({ user: { email: 'kevin@aephonics.com' } });

        expect(html).toContain('Back to dashboard');
        expect(html).not.toContain('Back to sign in');
    });
});
