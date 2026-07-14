import EditForm from '@components/dashboard/EditForm';
import TableEmpty from '@components/dashboard/TableEmpty';
import TableSortButton from '@components/dashboard/TableSortButton';
import TestimonialRow from '@components/dashboard/TestimonialRow';
import { FONT_MONO, STYLES } from '@lib/constants';

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
    function renderBody() {
        if (!testimonials.length) return <TableEmpty description="Try a different search, or add a new testimonial." title="No testimonials found" />;

        return testimonials.map(renderRow);
    }

    function renderRow(testimonial: AdminTestimonial) {
        return (
            <TestimonialRow
                isMobile={isMobile}
                key={testimonial.id}
                onDelete={() => onRequestDelete(testimonial.id)}
                onEdit={() => onStartEdit(testimonial.id)}
                testimonial={testimonial}
            />
        );
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
        <div style={{ margin: '0 auto', maxWidth: 1_280 }}>
            <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={STYLES.headingPanel}>Testimonials</h1>
                    <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12, letterSpacing: '.06em' }}>
                        {testimonials.length}
                        {' '}
                        {testimonials.length === 1 ? 'testimonial' : 'testimonials'}
                    </span>
                </div>
                <button
                    className="dashboard-button dashboard-button--primary"
                    onClick={onStartNew}
                    style={STYLES.buttonNew}
                    type="button"
                >
                    +&ensp;New testimonial
                </button>
            </div>
            <div
                aria-label={!testimonials.length || isMobile ? undefined : 'Testimonials'}
                role={!testimonials.length || isMobile ? undefined : 'table'}
                style={STYLES.tableBase}
                tabIndex={0}
            >
                {!isMobile && testimonials.length > 0 && (
                    <div
                        role="row"
                        style={{ ...STYLES.tableHeadBase, gridTemplateColumns: STYLES.gridTestimonials }}
                    >
                        <TableSortButton field="name" label="Name" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <TableSortButton field="role" label="Role" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <TableSortButton field="industry" label="Industry" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <span
                            role="columnheader"
                            style={STYLES.headerBase}
                        >
                            Quote
                        </span>
                        <span
                            role="columnheader"
                            style={STYLES.headerBase}
                        >
                            Actions
                        </span>
                    </div>
                )}
                {renderBody()}
            </div>
        </div>
    );
}
