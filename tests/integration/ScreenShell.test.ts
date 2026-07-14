import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import ScreenShell from '../../src/components/dashboard/ScreenShell';

type ShellProps = Parameters<typeof ScreenShell>[0];

function renderShell(overrides: Partial<ShellProps> = {}) {
    const props: ShellProps = {
        children: createElement('form', { 'aria-label': 'Shell body' }),
        footer: createElement('a', { href: '/' }, 'Back to site'),
        title: 'Sign in',
        ...overrides,
    };

    return renderToStaticMarkup(createElement(ScreenShell, props));
}

describe('ScreenShell', () => {
    test('centers a branded card on a raised surface', () => {
        const html = renderShell();

        expect(html).toContain('alt="InterSub"');
        expect(html).toContain('src="/apple-touch-icon.png"');
        expect(html).toContain('min-height:100vh');
        expect(html).toContain('max-width:420px');
        expect(html).toContain('background:var(--color-snow)');
    });

    test('renders the title as the card heading', () => {
        const html = renderShell();

        expect(html).toContain('>Sign in</h1>');
        expect(html.split('<h1').length - 1).toBe(1);
    });

    test('omits the subtitle and keeps the wide heading margin by default', () => {
        const html = renderShell();

        expect(html).toContain('margin:0 0 24px');
        expect(html).not.toContain('margin:0 0 6px');
    });

    test('renders the subtitle under a tightened heading when given', () => {
        const html = renderShell({ subtitle: 'Choose a password for your admin account.', title: 'Set your password' });

        expect(html).toContain('>Set your password</h1>');
        expect(html).toContain('Choose a password for your admin account.</p>');
        expect(html).toContain('margin:0 0 6px');
        expect(html).not.toContain('margin:0 0 24px');
    });

    test('renders the children inside the card', () => {
        const html = renderShell();

        expect(html).toMatch(/<h1[^>]*>Sign in<\/h1><form aria-label="Shell body"><\/form>/);
    });

    test('renders the footer after the card', () => {
        const html = renderShell();

        expect(html).toContain('</div><a href="/">Back to site</a>');
    });
});
