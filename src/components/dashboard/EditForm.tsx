import FormField from '@components/dashboard/FormField';
import Spinner from '@components/Spinner';
import { FONT_MONO, STYLES, TOUCH_TARGET } from '@lib/constants';

const PADDING_COMPACT = '11px 14px';

export default function EditForm<Values extends Record<keyof Values, string>>({ editingId, entity, fieldRows, form, formErrors, isMobile, isSaving, onCancel, onDelete, onSave, onUpdate }: {
    editingId: string;
    entity: string;
    fieldRows: EditFormField<Values>[][];
    form: Values;
    formErrors: Record<string, boolean>;
    isMobile: boolean;
    isSaving: boolean;
    onCancel: () => void;
    onDelete: () => void;
    onSave: () => void;
    onUpdate: (fields: Partial<Values>) => void;
}) {
    const isNew = editingId === 'new';

    const submitLabel = isNew ? `Create ${entity}` : 'Save changes';

    function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        onSave();
    }

    function renderControl(field: EditFormField<Values>, errorId: string) {
        const describedBy = formErrors[field.key] ? errorId : undefined;
        const inputClassName = formErrors[field.key] ? 'dashboard-input dashboard-input--error' : 'dashboard-input';

        function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
            onUpdate({ [field.key]: event.target.value } as Partial<Values>);
        }

        if (field.kind === 'select') {
            return (
                <div className="dashboard-select">
                    <select
                        className={inputClassName}
                        aria-describedby={describedBy}
                        onChange={handleChange}
                        style={{ ...STYLES.inputBase, appearance: 'none', background: STYLES.colorSurface, padding: PADDING_COMPACT }}
                        value={form[field.key]}
                    >
                        <option value="">None</option>
                        {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                </div>
            );
        }

        if (field.kind === 'textarea') {
            return (
                <textarea className={inputClassName} aria-describedby={describedBy} onChange={handleChange} rows={field.rows} style={{ ...STYLES.inputBase, ...(field.mono ? { fontFamily: FONT_MONO, fontSize: 12 } : {}), lineHeight: 1.6, minHeight: field.minHeight ?? 140, resize: 'vertical' }} value={form[field.key]} />
            );
        }

        return (
            <input className={inputClassName} aria-describedby={describedBy} onChange={handleChange} style={{ ...STYLES.inputBase, ...(field.kind === 'date' ? { padding: PADDING_COMPACT } : {}) }} type={field.kind === 'date' ? 'date' : undefined} value={form[field.key]} />
        );
    }

    function renderField(field: EditFormField<Values>) {
        const errorId = `error-${entity}-${field.key}`;

        return (
            <FormField
                errorId={errorId}
                errorMessage={formErrors[field.key] ? field.errorMessage : undefined}
                key={field.key}
                label={field.label}
                labelSuffix={field.labelSuffix}
                required={field.required}
            >
                {renderControl(field, errorId)}
            </FormField>
        );
    }

    function renderRow(row: EditFormField<Values>[]) {
        if (row.length === 1) return renderField(row[0]);

        return (
            <div
                key={row.map(field => field.key).join('-')}
                style={{ display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}
            >
                {row.map(renderField)}
            </div>
        );
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: 760 }}>
            <h1 style={{ ...STYLES.headingPanel, margin: '0 0 28px' }}>
                {isNew ? `New ${entity}` : `Edit ${entity}`}
            </h1>
            <form
                noValidate
                onSubmit={handleSubmit}
                style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: STYLES.borderRadiusLarge, display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(20px, calc(13.33px + 2.08vw), 40px)' }}
            >
                {fieldRows.map(renderRow)}
                <div style={{ borderTop: STYLES.borderDivider, display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 10, paddingTop: 24 }}>
                    <button
                        className="dashboard-button dashboard-button--primary"
                        aria-label={submitLabel}
                        disabled={isSaving}
                        style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', minHeight: TOUCH_TARGET, minWidth: isMobile ? undefined : 150 }}
                        type="submit"
                    >
                        {isSaving ? <Spinner /> : submitLabel}
                    </button>
                    <button
                        className="dashboard-button dashboard-button--outline"
                        disabled={isSaving}
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </button>
                    {!isNew && (
                        <>
                            {!isMobile && <div style={{ flex: 1 }} />}
                            <button
                                className="dashboard-button dashboard-button--danger"
                                disabled={isSaving}
                                onClick={onDelete}
                                type="button"
                            >
                                {`Delete ${entity}`}
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}
