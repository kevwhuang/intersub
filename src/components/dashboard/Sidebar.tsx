import { COBALT, FONT_HEADING, STYLES } from '@lib/constants';

const NAV_ITEMS = [
    { key: 'events', label: 'Events' },
    { key: 'outcomes', label: 'Outcomes' },
    { key: 'testimonials', label: 'Testimonials' },
] as const;

export default function Sidebar({ activePanel, isDrawerOpen, isMobile, onCloseDrawer, onLogout, onSelectPanel, userEmail }: {
    activePanel: string;
    isDrawerOpen: boolean;
    isMobile: boolean;
    onCloseDrawer: () => void;
    onLogout: () => void;
    onSelectPanel: (key: string) => void;
    userEmail: string;
}) {
    const sidebarStyle: React.CSSProperties = isMobile
        ? { background: STYLES.colorSurface, borderRight: STYLES.border, bottom: 0, boxShadow: isDrawerOpen ? STYLES.shadowSidebar : 'none', display: 'flex', flexDirection: 'column', left: 0, position: 'fixed', top: 60, transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-110%)', transition: 'transform 0.15s ease', width: 240, zIndex: 35 }
        : { alignSelf: 'flex-start', background: STYLES.colorSurface, borderRight: STYLES.border, display: 'flex', flex: 'none', flexDirection: 'column', height: 'calc(100vh - 60px)', marginLeft: isDrawerOpen ? 0 : -240, overflow: 'auto', position: 'sticky', top: 60, transition: 'margin-left 0.15s ease', width: 240 };

    return (
        <aside aria-label="Admin sidebar" style={sidebarStyle}>
            <a className="dashboard-link" href="/" style={{ borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'block', fontSize: 12, fontWeight: 600, padding: '14px 24px' }}>&larr; Back to site</a>
            <nav aria-label="Admin navigation" style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, padding: '14px 12px' }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = item.key === activePanel;

                    return (
                        <button
                            className={isActive ? 'dashboard-nav dashboard-nav--active' : 'dashboard-nav'}
                            key={item.key}
                            onClick={() => {
                                onSelectPanel(item.key);
                                if (isMobile) onCloseDrawer();
                            }}
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
                    <button className="dashboard-button dashboard-button--ghost dashboard-button--muted" onClick={onLogout} style={{ fontSize: 12, fontWeight: 500, padding: 0 }}>
                        Sign out
                    </button>
                </div>
            </div>
        </aside>
    );
}
