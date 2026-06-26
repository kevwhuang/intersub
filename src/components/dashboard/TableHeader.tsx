import { FONT_MONO, STYLES } from '@lib/constants';

export default function TableHeader({ onSort, sortDirection, sortKey }: {
    onSort: (field: string) => void;
    sortDirection: string;
    sortKey: string;
}) {
    function sortArrow(field: string) {
        return sortKey === field ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';
    }

    const headerStyle: React.CSSProperties = { alignItems: 'center', color: STYLES.colorGhost, display: 'flex', fontFamily: FONT_MONO, fontSize: 10, fontWeight: 500, gap: 5, justifyContent: 'flex-start', letterSpacing: '.08em', padding: 0, textAlign: 'left', textTransform: 'uppercase' };

    return (
        <div style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 130px 130px', padding: '12px clamp(14px, 2.5vw, 22px)' }}>
            <button className="dashboard-button--ghost" onClick={() => onSort('title')} style={headerStyle}>
                Title
                {sortArrow('title')}
            </button>
            <button className="dashboard-button--ghost" onClick={() => onSort('date')} style={headerStyle}>
                Date
                {sortArrow('date')}
            </button>
            <button className="dashboard-button--ghost" onClick={() => onSort('location')} style={headerStyle}>
                Location
                {sortArrow('location')}
            </button>
            <button className="dashboard-button--ghost" onClick={() => onSort('level')} style={headerStyle}>
                Level
                {sortArrow('level')}
            </button>
            <span style={{ ...headerStyle, justifyContent: 'flex-end', width: '100%' }}>Actions</span>
        </div>
    );
}
