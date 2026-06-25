import FormField from '@components/FormField';
import Spinner from '@components/Spinner';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

interface AdminOutcome {
    id: string;
    points: string[];
    summary: string;
    title: string;
}

export default function OutcomesPanel({ editingOutcome, isMobile, onCancelEdit, onSave, onStartEdit, onStartNew, onUpdate, outcomeForm, outcomeFormErrors, outcomes, saving, set }: {
    editingOutcome: string | null;
    isMobile: boolean;
    onCancelEdit: () => void;
    onSave: () => Promise<void>;
    onStartEdit: (id: string) => void;
    onStartNew: () => void;
    onUpdate: (fields: Partial<OutcomeFormData>) => void;
    outcomeForm: OutcomeFormData | null;
    outcomeFormErrors: Record<string, boolean>;
    outcomes: AdminOutcome[];
    saving: boolean;
    set: (payload: Partial<DashboardState>) => void;
}) {
    if (editingOutcome !== null && outcomeForm) {
        function errorBorder(field: string) {
            return outcomeFormErrors[field] ? '#e0a0a0' : '#dfe2e8';
        }

        return (
            <div style={{ margin: '0 auto', maxWidth: 760 }}>
                <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 28px' }}>
                    {editingOutcome === 'new' ? 'New outcome' : 'Edit outcome'}
                </h1>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSave();
                    }}
                    style={{ background: '#ffffff', border: STYLES.border, borderRadius: STYLES.borderRadiusLg, display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(20px, 3.5vw, 40px)' }}
                >
                    <FormField errorMessage={outcomeFormErrors.title ? 'Title is required.' : undefined} label="Title" required>
                        <input className="dashboard-input" value={outcomeForm.title} onChange={event => onUpdate({ title: event.target.value })} placeholder="e.g. Regional bank · client calls" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('title')}` }} />
                    </FormField>
                    <FormField errorMessage={outcomeFormErrors.summary ? 'Summary is required.' : undefined} label="Summary" required>
                        <textarea className="dashboard-input" value={outcomeForm.summary} onChange={event => onUpdate({ summary: event.target.value })} rows={3} placeholder="Brief description of the challenge" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('summary')}`, lineHeight: 1.6, minHeight: 140, resize: 'vertical' as const }} />
                    </FormField>
                    <FormField errorMessage={outcomeFormErrors.points ? 'At least one outcome is required.' : undefined} label="Outcomes" labelSuffix="· one per line" required>
                        <textarea className="dashboard-input" value={outcomeForm.points} onChange={event => onUpdate({ points: event.target.value })} rows={5} placeholder={'Now lead calls end-to-end in English\nFollow-up emails dropped by half'} style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('points')}`, fontFamily: FONT_MONO, fontSize: 13.5, lineHeight: 1.6, minHeight: 140, resize: 'vertical' as const }} />
                    </FormField>
                    <div style={{ borderTop: '1px solid #eceef2', display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                        <button className="dashboard-button--primary" disabled={saving} type="submit" style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', minHeight: 44, minWidth: isMobile ? undefined : 150 }}>
                            {saving ? <Spinner /> : editingOutcome === 'new' ? 'Create outcome' : 'Save changes'}
                        </button>
                        <button className="dashboard-button--outline" disabled={saving} type="button" onClick={onCancelEdit}>
                            Cancel
                        </button>
                        {editingOutcome !== 'new' && (
                            <>
                                {!isMobile && <div style={{ flex: 1 }} />}
                                <button className="dashboard-button--danger" disabled={saving} type="button" onClick={() => set({ confirmDelete: editingOutcome, confirmDeleteType: 'outcome' })}>
                                    Delete outcome
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        );
    }

    const actionStyle: React.CSSProperties = { borderRadius: 8, fontSize: 13, padding: '7px 12px' };

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
                <button className="dashboard-button--primary" onClick={onStartNew} style={{ alignItems: 'center', display: 'inline-flex', fontSize: 14, gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    +&ensp;New outcome
                </button>
            </div>
            <div style={{ background: '#ffffff', border: STYLES.border, borderRadius: 14, overflow: 'auto' }}>
                {!isMobile && (
                    <div style={{ alignItems: 'center', background: '#fafbfc', borderBottom: '1px solid #eceef2', display: 'grid', gap: 16, gridTemplateColumns: '1fr 2fr 80px 130px', padding: 'clamp(10px, 2vw, 13px) clamp(14px, 2.5vw, 22px)' }}>
                        <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>Title</span>
                        <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>Summary</span>
                        <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>Outcomes</span>
                        <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textAlign: 'right', textTransform: 'uppercase', width: '100%' }}>Actions</span>
                    </div>
                )}
                {outcomes.length > 0
                    ? outcomes.map(outcome => (
                            isMobile
                                ? (
                                        <div key={outcome.id} style={{ borderBottom: STYLES.colorRowBorder, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px clamp(14px, 2.5vw, 22px)' }}>
                                            <div>
                                                <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{outcome.title}</p>
                                                <p style={{ color: STYLES.colorMuted, fontSize: 13.5, lineHeight: 1.4, margin: '6px 0 0' }}>{outcome.summary}</p>
                                                <span style={{ color: STYLES.colorGhost, display: 'block', fontFamily: FONT_MONO, fontSize: 11, marginTop: 6 }}>
                                                    {outcome.points.length}
                                                    {' '}
                                                    {outcome.points.length === 1 ? 'outcome' : 'outcomes'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="dashboard-button--outline" onClick={() => onStartEdit(outcome.id)} style={{ ...actionStyle, flex: 1 }}>Edit</button>
                                                <button className="dashboard-button--danger" onClick={() => set({ confirmDelete: outcome.id, confirmDeleteType: 'outcome' })} style={{ ...actionStyle, flex: 1 }}>Delete</button>
                                            </div>
                                        </div>
                                    )
                                : (
                                        <div key={outcome.id} style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: '1fr 2fr 80px 130px', padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
                                            <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{outcome.title}</p>
                                            <p style={{ color: STYLES.colorMuted, fontSize: 13.5, lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outcome.summary}</p>
                                            <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12 }}>{outcome.points.length}</span>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button className="dashboard-button--outline" onClick={() => onStartEdit(outcome.id)} style={actionStyle}>Edit</button>
                                                <button className="dashboard-button--danger" onClick={() => set({ confirmDelete: outcome.id, confirmDeleteType: 'outcome' })} style={actionStyle}>Delete</button>
                                            </div>
                                        </div>
                                    )
                        ))
                    : (
                            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                                <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>No outcomes yet</p>
                                <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Add an outcome to highlight measurable client results on the site.</p>
                            </div>
                        )}
            </div>
        </div>
    );
}
