import { useEffect, useRef } from 'react';

import { COBALT, FONT_HEADING, SIDEBAR_WIDTH, STYLES, TOPBAR_HEIGHT } from '@lib/constants';

const NAV_ITEMS = [
    { key: 'events', label: 'Events' },
    { key: 'outcomes', label: 'Outcomes' },
    { key: 'testimonials', label: 'Testimonials' },
] as const;

export default function Sidebar({ activePanel, isDrawerOpen, isMobile, onCloseDrawer, onLogout, onSelectPanel, userEmail }: {
    activePanel: PanelKey;
    isDrawerOpen: boolean;
    isMobile: boolean;
    onCloseDrawer: () => void;
    onLogout: () => void;
    onSelectPanel: (key: PanelKey) => void;
    userEmail: string;
}) {
    const asideRef = useRef<HTMLElement>(null);

    const sidebarStyle: React.CSSProperties = isMobile
        ? { background: STYLES.colorSurface, borderRight: STYLES.border, bottom: 0, boxShadow: isDrawerOpen ? STYLES.shadowSidebar : 'none', display: 'flex', flexDirection: 'column', left: 0, overflow: 'auto', position: 'fixed', top: TOPBAR_HEIGHT, transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-110%)', transition: isDrawerOpen ? 'transform var(--duration-fast) ease' : 'transform var(--duration-fast) ease, visibility 0s ease var(--duration-fast)', visibility: isDrawerOpen ? 'visible' : 'hidden', width: SIDEBAR_WIDTH, zIndex: 35 }
        : { alignSelf: 'flex-start', background: STYLES.colorSurface, borderRight: STYLES.border, display: 'flex', flex: 'none', flexDirection: 'column', height: `calc(100vh - ${TOPBAR_HEIGHT}px)`, marginLeft: isDrawerOpen ? 0 : -SIDEBAR_WIDTH, overflow: 'auto', position: 'sticky', top: TOPBAR_HEIGHT, transition: isDrawerOpen ? 'margin-left var(--duration-fast) ease' : 'margin-left var(--duration-fast) ease, visibility 0s ease var(--duration-fast)', visibility: isDrawerOpen ? 'visible' : 'hidden', width: SIDEBAR_WIDTH };

    function handleSelect(key: PanelKey) {
        onSelectPanel(key);
        if (isMobile) onCloseDrawer();
    }

    useEffect(() => {
        if (!isDrawerOpen || !isMobile) return;

        const previousElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        requestAnimationFrame(() => requestAnimationFrame(() => asideRef.current?.querySelector<HTMLElement>('a, button')?.focus()));

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Tab' || !asideRef.current) return;

            const targets = asideRef.current.querySelectorAll<HTMLElement>('a, button');

            const first = targets[0];
            const last = targets[targets.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previousElement?.focus();
        };
    }, [isDrawerOpen, isMobile]);

    return (
        <aside aria-label="Admin sidebar" ref={asideRef} style={sidebarStyle}>
            <a className="dashboard-link" href="/" style={{ borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'block', fontSize: 12, fontWeight: 600, padding: '14px 24px' }}>&larr; Back to site</a>
            <nav aria-label="Admin navigation" style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, padding: '14px 12px' }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = item.key === activePanel;

                    return (
                        <button
                            className={isActive ? 'dashboard-nav dashboard-nav--active' : 'dashboard-nav'}
                            aria-current={isActive ? 'page' : undefined}
                            key={item.key}
                            onClick={() => handleSelect(item.key)}
                            style={{ alignItems: 'center', border: 'none', borderRadius: STYLES.borderRadiusSmall, display: 'flex', fontSize: 16, fontWeight: 600, overflow: 'hidden', padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', width: '100%' }}
                        >
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div style={{ borderTop: `1px solid ${STYLES.colorBorder}`, padding: '14px 12px' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px' }}>
                    <span style={{ alignItems: 'center', background: COBALT, borderRadius: '50%', color: STYLES.colorSurface, display: 'flex', flex: 'none', fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 600, height: 44, justifyContent: 'center', width: 44 }}>{userEmail.slice(0, 2).toUpperCase()}</span>
                    <button className="dashboard-link" onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 500, padding: 0 }} type="button">
                        Sign out
                    </button>
                </div>
            </div>
        </aside>
    );
}
