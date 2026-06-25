import FormField from '@components/FormField';
import Spinner from '@components/Spinner';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

export default function TestimonialsPanel({ editingTestimonial, isMobile, onCancelEdit, onSave, onSort, onStartEdit, onStartNew, onUpdate, saving, set, sortDir, sortKey, testimonialForm, testimonialFormErrors, testimonials }: {
    editingTestimonial: string | null;
    isMobile: boolean;
    onCancelEdit: () => void;
    onSave: () => Promise<void>;
    onSort: (field: string) => void;
    onStartEdit: (id: string) => void;
    onStartNew: () => void;
    onUpdate: (fields: Partial<TestimonialFormData>) => void;
    saving: boolean;
    set: (payload: Partial<DashboardState>) => void;
    sortDir: string;
    sortKey: string;
    testimonialForm: TestimonialFormData | null;
    testimonialFormErrors: Record<string, boolean>;
    testimonials: AdminTestimonial[];
}) {
    if (editingTestimonial !== null && testimonialForm) {
        function errorBorder(field: string) {
            return testimonialFormErrors[field] ? '#e0a0a0' : '#dfe2e8';
        }

        return (
            <div style={{ margin: '0 auto', maxWidth: 760 }}>
                <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 28px' }}>
                    {editingTestimonial === 'new' ? 'New testimonial' : 'Edit testimonial'}
                </h1>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        onSave();
                    }}
                    style={{ background: '#ffffff', border: STYLES.border, borderRadius: STYLES.borderRadiusLg, display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(20px, 3.5vw, 40px)' }}
                >
                    <FormField errorMessage={testimonialFormErrors.name ? 'Name is required.' : undefined} label="Name" required>
                        <input className="dashboard-input" value={testimonialForm.name} onChange={event => onUpdate({ name: event.target.value })} placeholder="e.g. Chen Yuan" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('name')}` }} />
                    </FormField>
                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                        <FormField errorMessage={testimonialFormErrors.role ? 'Role is required.' : undefined} label="Role" required>
                            <input className="dashboard-input" value={testimonialForm.role} onChange={event => onUpdate({ role: event.target.value })} placeholder="e.g. Product Director" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('role')}` }} />
                        </FormField>
                        <FormField errorMessage={testimonialFormErrors.industry ? 'Industry is required.' : undefined} label="Industry" required>
                            <input className="dashboard-input" value={testimonialForm.industry} onChange={event => onUpdate({ industry: event.target.value })} placeholder="e.g. Logistics" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('industry')}` }} />
                        </FormField>
                    </div>
                    <FormField errorMessage={testimonialFormErrors.quote ? 'Quote is required.' : undefined} label="Quote" required>
                        <textarea className="dashboard-input" value={testimonialForm.quote} onChange={event => onUpdate({ quote: event.target.value })} rows={4} placeholder="What the client said about working with InterSub." style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('quote')}`, lineHeight: 1.6, minHeight: 140, resize: 'vertical' as const }} />
                    </FormField>
                    <div style={{ borderTop: '1px solid #eceef2', display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                        <button className="dashboard-button--primary" disabled={saving} type="submit" style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', minHeight: 44, minWidth: isMobile ? undefined : 150 }}>
                            {saving ? <Spinner /> : editingTestimonial === 'new' ? 'Create testimonial' : 'Save changes'}
                        </button>
                        <button className="dashboard-button--outline" disabled={saving} type="button" onClick={onCancelEdit}>
                            Cancel
                        </button>
                        {editingTestimonial !== 'new' && (
                            <>
                                {!isMobile && <div style={{ flex: 1 }} />}
                                <button className="dashboard-button--danger" disabled={saving} type="button" onClick={() => set({ confirmDelete: editingTestimonial, confirmDeleteType: 'testimonial' })}>
                                    Delete testimonial
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
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Testimonials</h1>
                    <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12, letterSpacing: '.06em' }}>
                        {testimonials.length}
                        {' '}
                        {testimonials.length === 1 ? 'testimonial' : 'testimonials'}
                    </span>
                </div>
                <button className="dashboard-button--primary" onClick={onStartNew} style={{ alignItems: 'center', display: 'inline-flex', fontSize: 14, gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    +&ensp;New testimonial
                </button>
            </div>
            <div style={{ background: '#ffffff', border: STYLES.border, borderRadius: 14, overflow: 'auto' }}>
                {!isMobile && (
                    <div style={{ alignItems: 'center', background: '#fafbfc', borderBottom: '1px solid #eceef2', display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 1.5fr 130px', padding: 'clamp(10px, 2vw, 13px) clamp(14px, 2.5vw, 22px)' }}>
                        <button className="dashboard-button--ghost" onClick={() => onSort('name')} style={{ alignItems: 'center', color: STYLES.colorGhost, display: 'flex', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, gap: 5, letterSpacing: '.08em', padding: 0, textAlign: 'left', textTransform: 'uppercase' }}>
                            Name
                            {sortKey === 'name' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                        <button className="dashboard-button--ghost" onClick={() => onSort('role')} style={{ alignItems: 'center', color: STYLES.colorGhost, display: 'flex', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, gap: 5, letterSpacing: '.08em', padding: 0, textAlign: 'left', textTransform: 'uppercase' }}>
                            Role
                            {sortKey === 'role' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                        <button className="dashboard-button--ghost" onClick={() => onSort('industry')} style={{ alignItems: 'center', color: STYLES.colorGhost, display: 'flex', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, gap: 5, letterSpacing: '.08em', padding: 0, textAlign: 'left', textTransform: 'uppercase' }}>
                            Industry
                            {sortKey === 'industry' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                        <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>Quote</span>
                        <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textAlign: 'right', textTransform: 'uppercase', width: '100%' }}>Actions</span>
                    </div>
                )}
                {testimonials.length > 0
                    ? testimonials.map(testimonial => (
                            isMobile
                                ? (
                                        <div key={testimonial.id} style={{ borderBottom: STYLES.colorRowBorder, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px clamp(14px, 2.5vw, 22px)' }}>
                                            <div>
                                                <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{testimonial.name}</p>
                                                <p style={{ color: STYLES.colorMuted, fontSize: 13.5, lineHeight: 1.4, margin: '4px 0 0' }}>
                                                    {testimonial.role}
                                                    {' '}
                                                    &middot;
                                                    {' '}
                                                    {testimonial.industry}
                                                </p>
                                                <p style={{ color: STYLES.colorGhost, fontSize: 13, fontStyle: 'italic', lineHeight: 1.4, margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {testimonial.quote}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="dashboard-button--outline" onClick={() => onStartEdit(testimonial.id)} style={{ ...actionStyle, flex: 1 }}>Edit</button>
                                                <button className="dashboard-button--danger" onClick={() => set({ confirmDelete: testimonial.id, confirmDeleteType: 'testimonial' })} style={{ ...actionStyle, flex: 1 }}>Delete</button>
                                            </div>
                                        </div>
                                    )
                                : (
                                        <div key={testimonial.id} style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 1.5fr 130px', padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
                                            <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{testimonial.name}</p>
                                            <span style={{ color: STYLES.colorMuted, fontSize: 14 }}>{testimonial.role}</span>
                                            <span style={{ color: STYLES.colorMuted, fontSize: 14 }}>{testimonial.industry}</span>
                                            <p style={{ color: STYLES.colorGhost, fontSize: 13, fontStyle: 'italic', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {testimonial.quote}
                                            </p>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button className="dashboard-button--outline" onClick={() => onStartEdit(testimonial.id)} style={actionStyle}>Edit</button>
                                                <button className="dashboard-button--danger" onClick={() => set({ confirmDelete: testimonial.id, confirmDeleteType: 'testimonial' })} style={actionStyle}>Delete</button>
                                            </div>
                                        </div>
                                    )
                        ))
                    : (
                            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                                <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>No testimonials yet</p>
                                <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Add a testimonial to feature client feedback on the site.</p>
                            </div>
                        )}
            </div>
        </div>
    );
}
