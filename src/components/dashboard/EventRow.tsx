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
            <div style={{ borderBottom: STYLES.colorRowBorder, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px clamp(14px, 2.5vw, 22px)' }}>
                <div>
                    <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{entry.title}</p>
                    <div style={{ alignItems: 'center', color: STYLES.colorMuted, display: 'flex', fontSize: 12, gap: 8, marginTop: 6 }}>
                        <span>{formatDate(entry.date)}</span>
                        <span aria-hidden="true">&middot;</span>
                        <span>{entry.location}</span>
                    </div>
                </div>
                {meta && levelTagStyle && <span style={{ ...levelTagStyle, alignSelf: 'flex-start' }}>{meta.label}</span>}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button className="dashboard-button dashboard-button--outline" onClick={onEdit} style={{ ...STYLES.actionBase, flex: 1, padding: '14px 12px' }}>Edit</button>
                    <button className="dashboard-button dashboard-button--danger" onClick={onDelete} style={{ ...STYLES.actionBase, flex: 1, padding: '14px 12px' }}>Delete</button>
                </div>
            </div>
        );
    }

    return (
        <div role="row" style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: STYLES.gridEvents, padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
            <div role="cell" style={{ minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{entry.title}</p>
            </div>
            <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16, whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</span>
            <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16 }}>{entry.location}</span>
            <span role="cell">{meta && levelTagStyle && <span style={levelTagStyle}>{meta.label}</span>}</span>
            <div role="cell" style={{ display: 'flex', gap: 6 }}>
                <button className="dashboard-button dashboard-button--outline" onClick={onEdit} style={STYLES.actionBase}>Edit</button>
                <button className="dashboard-button dashboard-button--danger" onClick={onDelete} style={STYLES.actionBase}>Delete</button>
            </div>
        </div>
    );
}
