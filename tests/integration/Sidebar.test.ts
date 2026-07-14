import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import Sidebar from '../../src/components/dashboard/Sidebar';

type SidebarProps = Parameters<typeof Sidebar>[0];

function renderSidebar(overrides: Partial<SidebarProps> = {}) {
    return renderToStaticMarkup(createElement(Sidebar, {
        activePanel: 'events',
        isDrawerOpen: true,
        isMobile: false,
        onCloseDrawer: vi.fn(),
        onLogout: vi.fn(),
        onSelectPanel: vi.fn(),
        userEmail: 'kevin@aephonics.com',
        ...overrides,
    }));
}

describe('Sidebar', () => {
    test('renders navigation buttons for all three panels', () => {
        const html = renderSidebar();

        expect(html).toContain('aria-label="Admin sidebar"');
        expect(html).toContain('aria-label="Admin navigation"');
        expect(html).toContain('>Events</button>');
        expect(html).toContain('>Outcomes</button>');
        expect(html).toContain('>Testimonials</button>');
        expect(html.split('class="dashboard-nav').length - 1).toBe(3);
    });

    test('highlights the active panel with a class and aria-current', () => {
        const html = renderSidebar();

        expect(html).toMatch(/class="dashboard-nav dashboard-nav--active" aria-current="page"[^>]*>Events<\/button>/);
        expect(html.split('dashboard-nav--active').length - 1).toBe(1);
        expect(html.split('aria-current="page"').length - 1).toBe(1);
    });

    test('moves the highlight when another panel is active', () => {
        const html = renderSidebar({ activePanel: 'testimonials' });

        expect(html).toMatch(/class="dashboard-nav dashboard-nav--active" aria-current="page"[^>]*>Testimonials<\/button>/);
        expect(html).not.toMatch(/dashboard-nav--active"[^>]*aria-current="page"[^>]*>Events<\/button>/);
    });

    test('links back to the public site', () => {
        const html = renderSidebar();

        expect(html).toContain('href="/"');
        expect(html).toContain('\u2190 Back to site');
    });

    test('shows the user initials and a sign-out button', () => {
        const html = renderSidebar();

        expect(html).toContain('>KE</span>');
        expect(html).toContain('Sign out');
        expect(html).toContain('type="button"');
    });

    test('docks as a sticky column on desktop', () => {
        const html = renderSidebar();

        expect(html).toContain('position:sticky');
        expect(html).toContain('width:240px');
        expect(html).toContain('visibility:visible');
    });

    test('collapses offscreen when the desktop drawer is closed', () => {
        const html = renderSidebar({ isDrawerOpen: false });

        expect(html).toContain('margin-left:-240px');
        expect(html).toContain('visibility:hidden');
    });

    test('hides the fixed drawer when closed on mobile', () => {
        const html = renderSidebar({ isDrawerOpen: false, isMobile: true });

        expect(html).toContain('position:fixed');
        expect(html).toContain('translateX(-110%)');
        expect(html).toContain('visibility:hidden');
    });

    test('slides the drawer into view when open on mobile', () => {
        const html = renderSidebar({ isDrawerOpen: true, isMobile: true });

        expect(html).toContain('translateX(0)');
        expect(html).toContain('visibility:visible');
    });
});
