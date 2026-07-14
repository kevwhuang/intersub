import RowActions from '@components/dashboard/RowActions';
import { STYLES } from '@lib/constants';
import { formatDate } from '@lib/utils';

export default function EventRow({ entry, isMobile, onDelete, onEdit }: {
    entry: AdminEvent;
    isMobile: boolean;
    onDelete: () => void;
    onEdit: () => void;
}) {
    const levelClassName = entry.level ? `tag tag--${entry.level.toLowerCase()}` : undefined;

    if (isMobile) {
        return (
            <div style={STYLES.cardBase}>
                <div>
                    <p style={STYLES.cardTitle}>{entry.title}</p>
                    <p style={STYLES.cardMeta}>
                        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                        {entry.time && (
                            <>
                                {' '}
                                <span aria-hidden="true">&middot;</span>
                                {' '}
                                {entry.time}
                            </>
                        )}
                        {' '}
                        <span aria-hidden="true">&middot;</span>
                        {' '}
                        {entry.location}
                    </p>
                </div>
                {levelClassName && (
                    <span
                        className={levelClassName}
                        style={{ alignSelf: 'flex-start' }}
                    >
                        {entry.level}
                    </span>
                )}
                <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
            </div>
        );
    }

    return (
        <div
            role="row"
            style={{ ...STYLES.rowBase, gridTemplateColumns: STYLES.gridEvents }}
        >
            <p
                role="cell"
                style={STYLES.cellTitle}
            >
                {entry.title}
            </p>
            <span
                role="cell"
                style={STYLES.cellText}
            >
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            </span>
            <span
                role="cell"
                style={STYLES.cellText}
            >
                {entry.time}
            </span>
            <span
                role="cell"
                style={STYLES.cellText}
            >
                {entry.location}
            </span>
            <span
                role="cell"
                style={{ overflow: 'hidden' }}
            >
                {levelClassName && <span className={levelClassName}>{entry.level}</span>}
            </span>
            <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
        </div>
    );
}
