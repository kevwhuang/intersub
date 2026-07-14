import { STYLES, TOPBAR_HEIGHT, Z_INDEX } from '@lib/constants';

export default function TopBar({ isDrawerOpen, onSearchChange, onToggleDrawer, searchValue }: {
    isDrawerOpen: boolean;
    onSearchChange: (value: string) => void;
    onToggleDrawer: () => void;
    searchValue: string;
}) {
    return (
        <header style={{ alignItems: 'center', backdropFilter: 'blur(12px)', background: STYLES.colorSurface90, borderBottom: STYLES.border, display: 'flex', flex: 'none', gap: 14, height: TOPBAR_HEIGHT, padding: '0 16px', position: 'sticky', top: 0, zIndex: Z_INDEX.topBar }}>
            <button
                className="dashboard-button dashboard-button--ghost dashboard-button--hit"
                aria-expanded={isDrawerOpen}
                aria-label="Toggle navigation"
                onClick={onToggleDrawer}
                style={{ alignItems: 'center', border: STYLES.border, borderRadius: STYLES.borderRadiusSmall, display: 'flex', flex: 'none', height: 38, justifyContent: 'center', padding: 0, width: 38 }}
                type="button"
            >
                <span aria-hidden="true" style={{ background: STYLES.colorInk, boxShadow: `0 -5px 0 ${STYLES.colorInk}, 0 5px 0 ${STYLES.colorInk}`, display: 'block', height: 1.6, width: 16 }} />
            </button>
            <label style={{ flex: 1 }}>
                <span className="sr-only">Search</span>
                <input className="dashboard-input" onChange={event => onSearchChange(event.target.value)} placeholder="Search&hellip;" style={{ background: STYLES.colorSurfaceRaised, borderRadius: STYLES.borderRadiusSmall, color: STYLES.colorInk, fontSize: 16, padding: '9px 12px 9px 14px', width: '100%' }} value={searchValue} />
            </label>
        </header>
    );
}
