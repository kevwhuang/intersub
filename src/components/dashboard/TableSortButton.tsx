import { STYLES } from '@lib/constants';

export default function TableSortButton({ field, label, onSort, sortDirection, sortKey }: {
    field: string;
    label: string;
    onSort: (field: string) => void;
    sortDirection: SortDirection;
    sortKey: string;
}) {
    function getAriaSort(): 'ascending' | 'descending' | 'none' {
        if (sortKey !== field) return 'none';

        return sortDirection === 'asc' ? 'ascending' : 'descending';
    }

    function getSortArrow() {
        if (sortKey !== field) return '';

        return sortDirection === 'asc' ? ' \u2191' : ' \u2193';
    }

    return (
        <div aria-sort={getAriaSort()} role="columnheader">
            <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort(field)} style={STYLES.headerBase} type="button">
                {label}
                {getSortArrow()}
            </button>
        </div>
    );
}
