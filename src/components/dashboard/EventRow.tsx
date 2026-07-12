import RowActions from '@components/dashboard/RowActions';
import { FONT_MONO, STYLES } from '@lib/constants';
import { formatDate, getLevelMeta } from '@lib/utils';

export default function EventRow({ entry, isMobile, onDelete, onEdit }: {
    entry: AdminEvent;
    isMobile: boolean;
    onDelete: () => void;
    onEdit: () => void;
}) {
    const meta = entry.level ? getLevelMeta(entry.level) : null;

    const levelTagStyle: React.CSSProperties | undefined = meta ? { background: meta.background, borderRadius: 6, color: meta.foreground, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 500, letterSpacing: '.04em', padding: '4px 9px', textTransform: 'uppercase', whiteSpace: 'nowrap' } : undefined;

    if (isMobile) {
        return (
            <div style={{ borderBottom: STYLES.borderRow, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 14px' }}>
                <div>
                    <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{entry.title}</p>
                    <p style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: '4px 0 0' }}>
                        {formatDate(entry.date)}
                        {entry.time && (
                            <>
                                {' '}
                                &middot;
                                {' '}
                                {entry.time}
                            </>
                        )}
                        {' '}
                        &middot;
                        {' '}
                        {entry.location}
                    </p>
                </div>
                {meta && levelTagStyle && <span style={{ ...levelTagStyle, alignSelf: 'flex-start' }}>{entry.level}</span>}
                <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
            </div>
        );
    }

    return (
        <div role="row" style={{ alignItems: 'center', borderBottom: STYLES.borderRow, display: 'grid', gap: 16, gridTemplateColumns: STYLES.gridEvents, padding: '16px 22px' }}>
            <p role="cell" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</p>
            <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</span>
            <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.time}</span>
            <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.location}</span>
            <span role="cell" style={{ overflow: 'hidden' }}>{meta && levelTagStyle && <span style={levelTagStyle}>{entry.level}</span>}</span>
            <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
        </div>
    );
}
