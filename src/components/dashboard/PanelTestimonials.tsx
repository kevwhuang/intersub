import EditForm from '@components/dashboard/EditForm';
import RowActions from '@components/dashboard/RowActions';
import TableEmpty from '@components/dashboard/TableEmpty';
import TableSortButton from '@components/dashboard/TableSortButton';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

const GRID_TEMPLATE = '1fr 1fr 1fr 4.5fr 138px';

const TESTIMONIAL_FORM_ROWS: EditFormField<TestimonialFormData>[][] = [
    [{ errorMessage: 'Name is required.', key: 'name', kind: 'input', label: 'Name', required: true }],
    [{ errorMessage: 'Role is required.', key: 'role', kind: 'input', label: 'Role', required: true }],
    [{ errorMessage: 'Industry is required.', key: 'industry', kind: 'input', label: 'Industry', required: true }],
    [{ errorMessage: 'Quote is required.', key: 'quote', kind: 'textarea', label: 'Quote', required: true, rows: 4 }],
];

export default function PanelTestimonials({ editingTestimonialId, isMobile, isSaving, onCancelEdit, onRequestDelete, onSave, onSort, onStartEdit, onStartNew, onUpdate, sortDirection, sortKey, testimonialForm, testimonialFormErrors, testimonials }: {
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
    sortDirection: SortDirection;
    sortKey: string;
    testimonialForm: TestimonialFormData | null;
    testimonialFormErrors: Record<string, boolean>;
    testimonials: AdminTestimonial[];
}) {
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

    function renderRow(testimonial: AdminTestimonial) {
        if (isMobile) {
            return (
                <div key={testimonial.id} style={{ borderBottom: STYLES.borderRow, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 14px' }}>
                    <div>
                        <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{testimonial.name}</p>
                        <p style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: 0, paddingTop: 4 }}>
                            {testimonial.role}
                            {' '}
                            &middot;
                            {' '}
                            {testimonial.industry}
                        </p>
                        <p style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: 0, overflow: 'hidden', paddingTop: 6, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {testimonial.quote}
                        </p>
                    </div>
                    <RowActions isMobile={isMobile} onDelete={() => onRequestDelete(testimonial.id)} onEdit={() => onStartEdit(testimonial.id)} />
                </div>
            );
        }

        return (
            <div key={testimonial.id} role="row" style={{ alignItems: 'center', borderBottom: STYLES.borderRow, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: '16px 22px' }}>
                <p role="cell" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{testimonial.name}</p>
                <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{testimonial.role}</span>
                <span role="cell" style={{ color: STYLES.colorMuted, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{testimonial.industry}</span>
                <p role="cell" style={{ color: STYLES.colorMuted, fontSize: 12, lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {testimonial.quote}
                </p>
                <RowActions isMobile={isMobile} onDelete={() => onRequestDelete(testimonial.id)} onEdit={() => onStartEdit(testimonial.id)} />
            </div>
        );
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: 1280 }}>
            <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, calc(21.33px + 0.83vw), 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Testimonials</h1>
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
            <div aria-label={isMobile || !testimonials.length ? undefined : 'Testimonials'} role={isMobile || !testimonials.length ? undefined : 'table'} style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 14, overflow: 'auto' }} tabIndex={0}>
                {!isMobile && testimonials.length > 0 && (
                    <div role="row" style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, borderBottom: `1px solid ${STYLES.colorBorder}`, display: 'grid', gap: 16, gridTemplateColumns: GRID_TEMPLATE, padding: '12px 22px' }}>
                        <TableSortButton field="name" label="Name" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <TableSortButton field="role" label="Role" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <TableSortButton field="industry" label="Industry" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <span role="columnheader" style={STYLES.headerBase}>Quote</span>
                        <span role="columnheader" style={STYLES.headerBase}>Actions</span>
                    </div>
                )}
                {testimonials.length > 0
                    ? testimonials.map(renderRow)
                    : <TableEmpty description="Add a testimonial to feature client feedback on the site." title="No testimonials yet" />}
            </div>
        </div>
    );
}
