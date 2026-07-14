import TableSortButton from '@components/dashboard/TableSortButton';
import { STYLES } from '@lib/constants';

export default function EventTableHeader({ onSort, sortDirection, sortKey }: {
    onSort: (field: string) => void;
    sortDirection: SortDirection;
    sortKey: string;
}) {
    return (
        <div
            role="row"
            style={{ ...STYLES.tableHeadBase, gridTemplateColumns: STYLES.gridEvents }}
        >
            <TableSortButton field="title" label="Title" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
            <TableSortButton field="date" label="Date" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
            <span
                role="columnheader"
                style={STYLES.headerBase}
            >
                Time
            </span>
            <TableSortButton field="location" label="Location" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
            <TableSortButton field="level" label="Who" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
            <span
                role="columnheader"
                style={STYLES.headerBase}
            >
                Actions
            </span>
        </div>
    );
}
