import { COBALT, FONT_HEADING, STYLES } from '@lib/constants';

const NAV_ITEMS = [
    { key: 'events', label: 'Events' },
    { key: 'outcomes', label: 'Outcomes' },
    { key: 'testimonials', label: 'Testimonials' },
];

export default function AdminSidebar({ activePanel, drawerOpen, isMobile, onCloseDrawer, onLogout, onSelectPanel, userEmail }: {
    activePanel: string;
    drawerOpen: boolean;
    isMobile: boolean;
    onCloseDrawer: () => void;
    onLogout: () => void;
    onSelectPanel: (key: string) => void;
    userEmail: string;
}) {
    const sidebarStyle: React.CSSProperties = isMobile
        ? { background: STYLES.colorSurface, borderRight: STYLES.border, bottom: 0, boxShadow: drawerOpen ? STYLES.shadowSidebar : 'none', display: 'flex', flexDirection: 'column', left: 0, position: 'fixed', top: 60, transform: drawerOpen ? 'translateX(0)' : 'translateX(-110%)', transition: 'transform 0.15s ease', width: 240, zIndex: 35 }
        : { alignSelf: 'flex-start', background: STYLES.colorSurface, borderRight: STYLES.border, display: 'flex', flex: 'none', flexDirection: 'column', height: 'calc(100vh - 60px)', marginLeft: drawerOpen ? 0 : -240, overflow: 'auto', position: 'sticky', top: 60, transition: 'margin-left 0.15s ease', width: 240 };

    return (
        <aside aria-label="Admin sidebar" style={sidebarStyle}>
            <a className="dashboard-link" href="/" style={{ borderBottom: `1px solid ${STYLES.colorBorder}`, color: STYLES.colorGhost, display: 'block', fontSize: 12, fontWeight: 600, padding: '14px 24px' }}>&larr; Back to site</a>
            <nav aria-label="Admin navigation" style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, padding: '14px 12px' }}>
                {NAV_ITEMS.map((item) => {
                    const active = item.key === activePanel;

                    return (
                        <button
                            className="dashboard-nav"
                            key={item.key}
                            onClick={() => {
                                onSelectPanel(item.key);
                                if (isMobile) onCloseDrawer();
                            }}
                            style={{ alignItems: 'center', background: active ? `color-mix(in srgb, ${COBALT} 10%, ${STYLES.colorSurface})` : 'transparent', border: 'none', borderRadius: STYLES.borderRadiusSm, color: active ? COBALT : STYLES.colorInkSoft, display: 'flex', fontSize: 16, fontWeight: 600, gap: 12, overflow: 'hidden', padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', width: '100%' }}
                        >
                            <span style={{ background: active ? `color-mix(in srgb, ${COBALT} 22%, ${STYLES.colorSurface})` : 'transparent', border: `1.7px solid ${active ? COBALT : STYLES.colorGhost}`, borderRadius: 5, flex: 'none', height: 18, width: 18 }} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div style={{ borderTop: `1px solid ${STYLES.colorBorder}`, padding: '14px 12px' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px' }}>
                    <span style={{ alignItems: 'center', background: COBALT, borderRadius: '50%', color: STYLES.colorSurface, display: 'flex', flex: 'none', fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 600, height: 44, justifyContent: 'center', width: 44 }}>{userEmail.slice(0, 2).toUpperCase()}</span>
                    <button className="dashboard-button--ghost" onClick={onLogout} style={{ color: STYLES.colorGhost, fontSize: 12, fontWeight: 500, padding: 0 }}>
                        Sign out
                    </button>
                </div>
            </div>
        </aside>
    );
}
