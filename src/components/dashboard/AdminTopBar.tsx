import { STYLES } from '@lib/constants';

export default function AdminTopBar({ drawerOpen, onSearchChange, onToggleNav, searchValue }: {
    drawerOpen: boolean;
    onSearchChange: (value: string) => void;
    onToggleNav: () => void;
    searchValue: string;
}) {
    return (
        <header style={{ alignItems: 'center', backdropFilter: 'blur(12px)', background: STYLES.colorSurface90, borderBottom: STYLES.border, display: 'flex', flex: 'none', gap: 14, height: 60, padding: '0 16px', position: 'sticky', top: 0, zIndex: 40 }}>
            <button className="dashboard-button--ghost" aria-expanded={drawerOpen} aria-label="Toggle navigation" onClick={onToggleNav} style={{ alignItems: 'center', border: STYLES.border, borderRadius: STYLES.borderRadiusSm, display: 'flex', flex: 'none', height: 38, justifyContent: 'center', width: 38 }}>
                <span style={{ background: STYLES.colorInk, boxShadow: `0 -5px 0 ${STYLES.colorInk}, 0 5px 0 ${STYLES.colorInk}`, display: 'block', height: 1.6, width: 16 }} />
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
                <input className="dashboard-input" aria-label="Search" value={searchValue} onChange={event => onSearchChange(event.target.value)} placeholder="Search…" style={{ background: STYLES.colorSurfaceRaised, border: STYLES.border, borderRadius: STYLES.borderRadiusSm, color: STYLES.colorInk, fontSize: 16, padding: '9px 12px 9px 14px', width: '100%' }} />
            </div>
        </header>
    );
}
