import EditForm from '@components/dashboard/EditForm';
import OutcomeRow from '@components/dashboard/OutcomeRow';
import TableEmpty from '@components/dashboard/TableEmpty';
import TableSortButton from '@components/dashboard/TableSortButton';
import { FONT_MONO, STYLES } from '@lib/constants';

const OUTCOME_FORM_ROWS: EditFormField<OutcomeFormData>[][] = [
    [{ errorMessage: 'Title is required.', key: 'title', kind: 'input', label: 'Title', required: true }],
    [{ errorMessage: 'Summary is required.', key: 'summary', kind: 'textarea', label: 'Summary', required: true, rows: 3 }],
    [{ errorMessage: 'At least one outcome is required.', isMonospace: true, key: 'points', kind: 'textarea', label: 'Outcomes', labelSuffix: '\u00B7 one per line', required: true, rows: 5 }],
];

export default function PanelOutcomes({ editingOutcomeId, isMobile, isSaving, onCancelEdit, onRequestDelete, onSave, onSort, onStartEdit, onStartNew, onUpdate, outcomeForm, outcomeFormErrors, outcomes, sortDirection, sortKey }: {
    editingOutcomeId: string | null;
    isMobile: boolean;
    isSaving: boolean;
    onCancelEdit: () => void;
    onRequestDelete: (id: string) => void;
    onSave: () => Promise<void>;
    onSort: (field: string) => void;
    onStartEdit: (id: string) => void;
    onStartNew: () => void;
    onUpdate: (fields: Partial<OutcomeFormData>) => void;
    outcomeForm: OutcomeFormData | null;
    outcomeFormErrors: Record<string, boolean>;
    outcomes: AdminOutcome[];
    sortDirection: SortDirection;
    sortKey: string;
}) {
    function renderBody() {
        if (!outcomes.length) return <TableEmpty description="Try a different search, or add a new outcome." title="No outcomes found" />;

        return outcomes.map(renderRow);
    }

    function renderRow(outcome: AdminOutcome) {
        return (
            <OutcomeRow
                isMobile={isMobile}
                key={outcome.id}
                onDelete={() => onRequestDelete(outcome.id)}
                onEdit={() => onStartEdit(outcome.id)}
                outcome={outcome}
            />
        );
    }

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
        <div style={{ margin: '0 auto', maxWidth: 1_280 }}>
            <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={STYLES.headingPanel}>Outcomes</h1>
                    <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 12, letterSpacing: '.06em' }}>
                        {outcomes.length}
                        {' '}
                        {outcomes.length === 1 ? 'outcome' : 'outcomes'}
                    </span>
                </div>
                <button
                    className="dashboard-button dashboard-button--primary"
                    onClick={onStartNew}
                    style={STYLES.buttonNew}
                    type="button"
                >
                    +&ensp;New outcome
                </button>
            </div>
            <div
                aria-label={!outcomes.length || isMobile ? undefined : 'Outcomes'}
                role={!outcomes.length || isMobile ? undefined : 'table'}
                style={STYLES.tableBase}
                tabIndex={0}
            >
                {!isMobile && outcomes.length > 0 && (
                    <div
                        role="row"
                        style={{ ...STYLES.tableHeadBase, gridTemplateColumns: STYLES.gridOutcomes }}
                    >
                        <TableSortButton field="title" label="Title" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <TableSortButton field="summary" label="Summary" onSort={onSort} sortDirection={sortDirection} sortKey={sortKey} />
                        <span
                            role="columnheader"
                            style={STYLES.headerBase}
                        >
                            Outcomes
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
