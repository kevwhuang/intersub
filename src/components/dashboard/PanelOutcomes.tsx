import EditForm from '@components/dashboard/EditForm';
import RowActions from '@components/dashboard/RowActions';
import TableEmpty from '@components/dashboard/TableEmpty';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

const GRID_TEMPLATE = '1fr 2fr 82px 138px';

const OUTCOME_FORM_ROWS: EditFormField<OutcomeFormData>[][] = [
    [{ errorMessage: 'Title is required.', key: 'title', kind: 'input', label: 'Title', required: true }],
    [{ errorMessage: 'Summary is required.', key: 'summary', kind: 'textarea', label: 'Summary', required: true, rows: 3 }],
    [{ errorMessage: 'At least one outcome is required.', key: 'points', kind: 'textarea', label: 'Outcomes', labelSuffix: '\u00B7 one per line', mono: true, required: true, rows: 5 }],
];

export default function PanelOutcomes({ editingOutcomeId, isMobile, isSaving, onCancelEdit, onRequestDelete, onSave, onStartEdit, onStartNew, onUpdate, outcomeForm, outcomeFormErrors, outcomes }: {
    editingOutcomeId: string | null;
    isMobile: boolean;
    isSaving: boolean;
    onCancelEdit: () => void;
    onRequestDelete: (id: string) => void;
    onSave: () => Promise<void>;
    onStartEdit: (id: string) => void;
    onStartNew: () => void;
    onUpdate: (fields: Partial<OutcomeFormData>) => void;
    outcomeForm: OutcomeFormData | null;
    outcomeFormErrors: Record<string, boolean>;
    outcomes: AdminOutcome[];
}) {
    if (editingOutcomeId !== null && outcomeForm) {
        return (
            <EditForm
                editingId={editingOutcomeId}
                entity="outcome"
                fieldRows={OUTCOME_FORM_ROWS}
                form={outcomeForm}
                formErrors={outcomeFormErrors}
                isMobile={isMobile}
                isSaving={isSaving}
                onCancel={onCancelEdit}
                onDelete={() => onRequestDelete(editingOutcomeId)}
                onSave={onSave}
                onUpdate={onUpdate}
            />
        );
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: 1280 }}>
            <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, calc(21.33px + 0.83vw), 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Outcomes</h1>
                    <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12, letterSpacing: '.06em' }}>
                        {outcomes.length}
                        {' '}
                        {outcomes.length === 1 ? 'outcome' : 'outcomes'}
                    </span>
                </div>
                <button className="dashboard-button dashboard-button--primary" onClick={onStartNew} style={{ alignItems: 'center', display: 'inline-flex', gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    +&ensp;New outcome
                </button>
            </div>
            <div aria-label={isMobile || !outcomes.length ? undefined : 'Outcomes'} role={isMobile || !outcomes.length ? undefined : 'table'} style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 14, overflow: 'auto' }}>
                {!isMobile && outcomes.length > 0 && (
                    <div role="row" style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: '12px 22px' }}>
                        <span role="columnheader" style={STYLES.headerBase}>Title</span>
                        <span role="columnheader" style={STYLES.headerBase}>Summary</span>
                        <span role="columnheader" style={STYLES.headerBase}>Outcomes</span>
                        <span role="columnheader" style={STYLES.headerBase}>Actions</span>
                    </div>
                )}
                {outcomes.length > 0
                    ? outcomes.map(outcome => (
                            isMobile
                                ? (
                                        <div key={outcome.id} style={{ borderBottom: STYLES.borderRow, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 14px' }}>
                                            <div>
                                                <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{outcome.title}</p>
                                                <p style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outcome.summary}</p>
                                                <span style={{ color: STYLES.colorGhost, display: 'block', fontFamily: FONT_MONO, fontSize: 12, marginTop: 6 }}>
                                                    {outcome.points.length}
                                                    {' '}
                                                    {outcome.points.length === 1 ? 'outcome' : 'outcomes'}
                                                </span>
                                            </div>
                                            <RowActions isMobile={isMobile} onDelete={() => onRequestDelete(outcome.id)} onEdit={() => onStartEdit(outcome.id)} />
                                        </div>
                                    )
                                : (
                                        <div key={outcome.id} role="row" style={{ alignItems: 'center', borderBottom: STYLES.borderRow, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: '16px 22px' }}>
                                            <p role="cell" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outcome.title}</p>
                                            <p role="cell" style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outcome.summary}</p>
                                            <span role="cell" style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outcome.points.length}</span>
                                            <RowActions isMobile={isMobile} onDelete={() => onRequestDelete(outcome.id)} onEdit={() => onStartEdit(outcome.id)} />
                                        </div>
                                    )
                        ))
                    : <TableEmpty description="Add an outcome to highlight measurable client results on the site." title="No outcomes yet" />}
            </div>
        </div>
    );
}
