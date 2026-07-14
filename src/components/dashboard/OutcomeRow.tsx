import RowActions from '@components/dashboard/RowActions';
import { FONT_MONO, STYLES } from '@lib/constants';

export default function OutcomeRow({ isMobile, onDelete, onEdit, outcome }: {
    isMobile: boolean;
    onDelete: () => void;
    onEdit: () => void;
    outcome: AdminOutcome;
}) {
    if (isMobile) {
        return (
            <div style={STYLES.cardBase}>
                <div>
                    <p style={STYLES.cardTitle}>{outcome.title}</p>
                    <p style={{ ...STYLES.cardMeta, overflow: 'hidden', paddingTop: 6, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outcome.summary}</p>
                    <span style={{ color: STYLES.colorGhost, display: 'block', fontFamily: FONT_MONO, fontSize: 12, paddingTop: 6 }}>
                        {outcome.points.length}
                        {' '}
                        {outcome.points.length === 1 ? 'outcome' : 'outcomes'}
                    </span>
                </div>
                <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
            </div>
        );
    }

    return (
        <div
            role="row"
            style={{ ...STYLES.rowBase, gridTemplateColumns: STYLES.gridOutcomes }}
        >
            <p
                role="cell"
                style={STYLES.cellTitle}
            >
                {outcome.title}
            </p>
            <p
                role="cell"
                style={STYLES.cellNote}
            >
                {outcome.summary}
            </p>
            <span
                role="cell"
                style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
                {outcome.points.length}
            </span>
            <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
        </div>
    );
}
