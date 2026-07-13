import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import Dashboard from '../../src/components/Dashboard';

const html = renderToStaticMarkup(createElement(Dashboard));

describe('Dashboard', () => {
    test('renders the auth loading screen on the initial server render', () => {
        expect(html).toContain('Loading\u2026');
        expect(html).toContain('animation:dashboard__spin');
        expect(html).toContain('height:64px');
        expect(html).toContain('width:64px');
        expect(html).toContain('aria-hidden="true"');
    });

    test('withholds auth screens and dashboard chrome while loading', () => {
        expect(html).not.toContain('aria-label="Sign in"');
        expect(html).not.toContain('aria-label="Toggle navigation"');
        expect(html).not.toContain('aria-label="Admin sidebar"');
        expect(html).not.toContain('Set your password');
    });
});
