import { FONT_MONO, STYLES } from '@lib/constants';
import { formatDate, getLevelMeta } from '@lib/utils';

export default function EventRow({ entry, isMobile, onDelete, onEdit }: {
    isMobile: boolean;
    onDelete: () => void;
    onEdit: () => void;
    entry: AdminEvent;
}) {
    const meta = entry.level ? getLevelMeta(entry.level) : null;

    const actionStyle: React.CSSProperties = { borderRadius: 8, fontSize: 12, padding: '7px 12px' };

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
                {meta && <span style={{ alignSelf: 'flex-start', background: meta.bg, borderRadius: 6, color: meta.fg, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 500, letterSpacing: '.04em', padding: '4px 9px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{meta.label}</span>}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button className="dashboard-button--outline" onClick={onEdit} style={{ ...actionStyle, flex: 1 }}>Edit</button>
                    <button className="dashboard-button--danger" onClick={onDelete} style={{ ...actionStyle, flex: 1 }}>Delete</button>
                </div>
            </div>
        );
    }

    const levelTagStyle: React.CSSProperties | undefined = meta ? { background: meta.bg, borderRadius: 6, color: meta.fg, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 500, letterSpacing: '.04em', padding: '4px 9px', textTransform: 'uppercase', whiteSpace: 'nowrap' } : undefined;

    return (
        <div style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 130px 130px', padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{entry.title}</p>
            </div>
            <span style={{ color: STYLES.colorMuted, fontSize: 16, whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</span>
            <span style={{ color: STYLES.colorMuted, fontSize: 16 }}>{entry.location}</span>
            <span>{meta && levelTagStyle && <span style={levelTagStyle}>{meta.label}</span>}</span>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button className="dashboard-button--outline" onClick={onEdit} style={actionStyle}>Edit</button>
                <button className="dashboard-button--danger" onClick={onDelete} style={actionStyle}>Delete</button>
            </div>
        </div>
    );
}
