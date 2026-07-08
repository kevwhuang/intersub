import EditForm from '@components/dashboard/EditForm';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

const GRID_TEMPLATE = '1fr 2fr 80px 114px';

const OUTCOME_FORM_ROWS: EditFormField<OutcomeFormData>[][] = [
    [{ errorMessage: 'Title is required.', key: 'title', kind: 'input', label: 'Title', placeholder: 'e.g. Regional bank \u00B7 client calls', required: true }],
    [{ errorMessage: 'Summary is required.', key: 'summary', kind: 'textarea', label: 'Summary', placeholder: 'Brief description of the challenge', required: true, rows: 3 }],
    [{ errorMessage: 'At least one outcome is required.', key: 'points', kind: 'textarea', label: 'Outcomes', labelSuffix: '\u00B7 one per line', mono: true, placeholder: 'Now lead calls end-to-end in English\nFollow-up emails dropped by half', required: true, rows: 5 }],
];

export default function OutcomesPanel({ editingOutcomeId, isMobile, isSaving, onCancelEdit, onRequestDelete, onSave, onStartEdit, onStartNew, onUpdate, outcomeForm, outcomeFormErrors, outcomes }: {
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
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Outcomes</h1>
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
            <div aria-label={isMobile ? undefined : 'Outcomes'} role={isMobile ? undefined : 'table'} style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 14, overflow: 'auto' }}>
                {!isMobile && (
                    <div role="row" style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: '12px clamp(14px, 2.5vw, 22px)' }}>
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
                                        <div key={outcome.id} style={{ borderBottom: STYLES.colorRowBorder, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px clamp(14px, 2.5vw, 22px)' }}>
                                            <div>
                                                <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{outcome.title}</p>
                                                <p style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: '6px 0 0' }}>{outcome.summary}</p>
                                                <span style={{ color: STYLES.colorGhost, display: 'block', fontFamily: FONT_MONO, fontSize: 10, marginTop: 6 }}>
                                                    {outcome.points.length}
                                                    {' '}
                                                    {outcome.points.length === 1 ? 'outcome' : 'outcomes'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="dashboard-button dashboard-button--outline" onClick={() => onStartEdit(outcome.id)} style={{ ...STYLES.actionBase, flex: 1, padding: '14px 12px' }}>Edit</button>
                                                <button className="dashboard-button dashboard-button--danger" onClick={() => onRequestDelete(outcome.id)} style={{ ...STYLES.actionBase, flex: 1, padding: '14px 12px' }}>Delete</button>
                                            </div>
                                        </div>
                                    )
                                : (
                                        <div key={outcome.id} role="row" style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
                                            <p role="cell" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{outcome.title}</p>
                                            <p role="cell" style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outcome.summary}</p>
                                            <span role="cell" style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12 }}>{outcome.points.length}</span>
                                            <div role="cell" style={{ display: 'flex', gap: 6 }}>
                                                <button className="dashboard-button dashboard-button--outline" onClick={() => onStartEdit(outcome.id)} style={STYLES.actionBase}>Edit</button>
                                                <button className="dashboard-button dashboard-button--danger" onClick={() => onRequestDelete(outcome.id)} style={STYLES.actionBase}>Delete</button>
                                            </div>
                                        </div>
                                    )
                        ))
                    : (
                            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                                <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>No outcomes yet</p>
                                <p style={{ color: STYLES.colorGhost, fontSize: 16, margin: 0 }}>Add an outcome to highlight measurable client results on the site.</p>
                            </div>
                        )}
            </div>
        </div>
    );
}
