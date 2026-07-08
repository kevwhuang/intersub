import EditForm from '@components/dashboard/EditForm';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

const GRID_TEMPLATE = '1fr 120px 120px 1.5fr 114px';

const TESTIMONIAL_FORM_ROWS: EditFormField<TestimonialFormData>[][] = [
    [{ errorMessage: 'Name is required.', key: 'name', kind: 'input', label: 'Name', placeholder: 'e.g. Chen Yuan', required: true }],
    [
        { errorMessage: 'Role is required.', key: 'role', kind: 'input', label: 'Role', placeholder: 'e.g. Product Director', required: true },
        { errorMessage: 'Industry is required.', key: 'industry', kind: 'input', label: 'Industry', placeholder: 'e.g. Logistics', required: true },
    ],
    [{ errorMessage: 'Quote is required.', key: 'quote', kind: 'textarea', label: 'Quote', placeholder: 'What the client said about working with InterSub.', required: true, rows: 4 }],
];

export default function TestimonialsPanel({ editingTestimonialId, isMobile, isSaving, onCancelEdit, onRequestDelete, onSave, onSort, onStartEdit, onStartNew, onUpdate, sortDirection, sortKey, testimonialForm, testimonialFormErrors, testimonials }: {
    editingTestimonialId: string | null;
    isMobile: boolean;
    isSaving: boolean;
    onCancelEdit: () => void;
    onRequestDelete: (id: string) => void;
    onSave: () => Promise<void>;
    onSort: (field: string) => void;
    onStartEdit: (id: string) => void;
    onStartNew: () => void;
    onUpdate: (fields: Partial<TestimonialFormData>) => void;
    sortDirection: string;
    sortKey: string;
    testimonialForm: TestimonialFormData | null;
    testimonialFormErrors: Record<string, boolean>;
    testimonials: AdminTestimonial[];
}) {
    function getAriaSort(field: string): 'ascending' | 'descending' | 'none' {
        if (sortKey !== field) return 'none';

        return sortDirection === 'asc' ? 'ascending' : 'descending';
    }

    function getSortArrow(field: string) {
        if (sortKey !== field) return '';

        return sortDirection === 'asc' ? ' \u2191' : ' \u2193';
    }

    if (editingTestimonialId !== null && testimonialForm) {
        return (
            <EditForm
                editingId={editingTestimonialId}
                entity="testimonial"
                fieldRows={TESTIMONIAL_FORM_ROWS}
                form={testimonialForm}
                formErrors={testimonialFormErrors}
                isMobile={isMobile}
                isSaving={isSaving}
                onCancel={onCancelEdit}
                onDelete={() => onRequestDelete(editingTestimonialId)}
                onSave={onSave}
                onUpdate={onUpdate}
            />
        );
    }

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
                <button className="dashboard-button dashboard-button--primary" onClick={onStartNew} style={{ alignItems: 'center', display: 'inline-flex', gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    +&ensp;New testimonial
                </button>
            </div>
            <div aria-label={isMobile ? undefined : 'Testimonials'} role={isMobile ? undefined : 'table'} style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 14, overflow: 'auto' }}>
                {!isMobile && (
                    <div role="row" style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: '12px clamp(14px, 2.5vw, 22px)' }}>
                        <div aria-sort={getAriaSort('name')} role="columnheader">
                            <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort('name')} style={STYLES.headerBase}>
                                Name
                                {getSortArrow('name')}
                            </button>
                        </div>
                        <div aria-sort={getAriaSort('role')} role="columnheader">
                            <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort('role')} style={STYLES.headerBase}>
                                Role
                                {getSortArrow('role')}
                            </button>
                        </div>
                        <div aria-sort={getAriaSort('industry')} role="columnheader">
                            <button className="dashboard-button dashboard-button--ghost" onClick={() => onSort('industry')} style={STYLES.headerBase}>
                                Industry
                                {getSortArrow('industry')}
                            </button>
                        </div>
                        <span role="columnheader" style={STYLES.headerBase}>Quote</span>
                        <span role="columnheader" style={STYLES.headerBase}>Actions</span>
                    </div>
                )}
                {testimonials.length > 0
                    ? testimonials.map(testimonial => (
                            isMobile
                                ? (
                                        <div key={testimonial.id} style={{ borderBottom: STYLES.colorRowBorder, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px clamp(14px, 2.5vw, 22px)' }}>
                                            <div>
                                                <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{testimonial.name}</p>
                                                <p style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: '4px 0 0' }}>
                                                    {testimonial.role}
                                                    {' '}
                                                    &middot;
                                                    {' '}
                                                    {testimonial.industry}
                                                </p>
                                                <p style={{ color: STYLES.colorGhost, fontSize: 12, fontStyle: 'italic', lineHeight: 1.4, margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {testimonial.quote}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="dashboard-button dashboard-button--outline" onClick={() => onStartEdit(testimonial.id)} style={{ ...STYLES.actionBase, flex: 1, padding: '14px 12px' }}>Edit</button>
                                                <button className="dashboard-button dashboard-button--danger" onClick={() => onRequestDelete(testimonial.id)} style={{ ...STYLES.actionBase, flex: 1, padding: '14px 12px' }}>Delete</button>
                                            </div>
                                        </div>
                                    )
                                : (
                                        <div key={testimonial.id} role="row" style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
                                            <p role="cell" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{testimonial.name}</p>
                                            <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16 }}>{testimonial.role}</span>
                                            <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16 }}>{testimonial.industry}</span>
                                            <p role="cell" style={{ color: STYLES.colorGhost, fontSize: 12, fontStyle: 'italic', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {testimonial.quote}
                                            </p>
                                            <div role="cell" style={{ display: 'flex', gap: 6 }}>
                                                <button className="dashboard-button dashboard-button--outline" onClick={() => onStartEdit(testimonial.id)} style={STYLES.actionBase}>Edit</button>
                                                <button className="dashboard-button dashboard-button--danger" onClick={() => onRequestDelete(testimonial.id)} style={STYLES.actionBase}>Delete</button>
                                            </div>
                                        </div>
                                    )
                        ))
                    : (
                            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                                <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>No testimonials yet</p>
                                <p style={{ color: STYLES.colorGhost, fontSize: 16, margin: 0 }}>Add a testimonial to feature client feedback on the site.</p>
                            </div>
                        )}
            </div>
        </div>
    );
}
