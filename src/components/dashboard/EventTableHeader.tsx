import { STYLES } from '@lib/constants';

export default function EventTableHeader({ onSort, sortDirection, sortKey }: {
    onSort: (field: string) => void;
    sortDirection: string;
    sortKey: string;
}) {
    function getAriaSort(field: string): 'ascending' | 'descending' | 'none' {
        if (sortKey !== field) return 'none';

        return sortDirection === 'asc' ? 'ascending' : 'descending';
    }

    function getSortArrow(field: string) {
        if (sortKey !== field) return '';

        return sortDirection === 'asc' ? ' \u2191' : ' \u2193';
    }

    return (
        <div role="row" style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'grid', gap: 16, gridTemplateColumns: STYLES.gridEvents, padding: '12px clamp(14px, 2.5vw, 22px)' }}>
            <div aria-sort={getAriaSort('title')} role="columnheader">
                <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort('title')} style={STYLES.headerBase}>
                    Title
                    {getSortArrow('title')}
                </button>
            </div>
            <div aria-sort={getAriaSort('date')} role="columnheader">
                <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort('date')} style={STYLES.headerBase}>
                    Date
                    {getSortArrow('date')}
                </button>
            </div>
            <div aria-sort={getAriaSort('location')} role="columnheader">
                <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort('location')} style={STYLES.headerBase}>
                    Location
                    {getSortArrow('location')}
                </button>
            </div>
            <div aria-sort={getAriaSort('level')} role="columnheader">
                <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort('level')} style={STYLES.headerBase}>
                    Level
                    {getSortArrow('level')}
                </button>
            </div>
            <span role="columnheader" style={STYLES.headerBase}>Actions</span>
        </div>
    );
}
