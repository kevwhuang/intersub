import FormField from '@components/dashboard/FormField';
import Spinner from '@components/Spinner';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

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

    function renderControl(field: EditFormField<Values>) {
        const describedBy = formErrors[field.key] ? `error-${entity}-${field.key}` : undefined;
        const inputClassName = formErrors[field.key] ? 'dashboard-input dashboard-input--error' : 'dashboard-input';

        function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
            onUpdate({ [field.key]: event.target.value } as Partial<Values>);
        }

        if (field.kind === 'select') {
            return (
                <select className="dashboard-input" value={form[field.key]} onChange={handleChange} style={{ ...STYLES.inputBase, background: STYLES.colorSurface, padding: '11px 14px' }}>
                    <option value="">None</option>
                    {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
            );
        }

        if (field.kind === 'textarea') {
            return (
                <textarea className={inputClassName} aria-describedby={describedBy} value={form[field.key]} onChange={handleChange} rows={field.rows} placeholder={field.placeholder} style={{ ...STYLES.inputBase, ...(field.mono ? { fontFamily: FONT_MONO, fontSize: 12 } : {}), lineHeight: 1.6, minHeight: field.minHeight ?? 140, resize: 'vertical' as const }} />
            );
        }

        return (
            <input className={inputClassName} aria-describedby={describedBy} value={form[field.key]} onChange={handleChange} placeholder={field.placeholder} type={field.kind === 'date' ? 'date' : undefined} style={{ ...STYLES.inputBase, ...(field.kind === 'date' ? { padding: '11px 14px' } : {}) }} />
        );
    }

    function renderField(field: EditFormField<Values>) {
        return (
            <FormField errorId={`error-${entity}-${field.key}`} errorMessage={formErrors[field.key] ? field.errorMessage : undefined} key={field.key} label={field.label} labelSuffix={field.labelSuffix} required={field.required}>
                {renderControl(field)}
            </FormField>
        );
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: 760 }}>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, calc(21.33px + 0.83vw), 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 28px' }}>
                {isNew ? `New ${entity}` : `Edit ${entity}`}
            </h1>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSave();
                }}
                style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: STYLES.borderRadiusLarge, display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(20px, calc(13.33px + 2.08vw), 40px)' }}
            >
                {fieldRows.map(row => (
                    row.length === 1
                        ? renderField(row[0])
                        : (
                                <div key={row.map(field => field.key).join('-')} style={{ display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                                    {row.map(renderField)}
                                </div>
                            )
                ))}
                <div style={{ borderTop: `1px solid ${STYLES.colorBorder}`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                    <button className="dashboard-button dashboard-button--primary" disabled={isSaving} type="submit" style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', minHeight: 44, minWidth: isMobile ? undefined : 150 }}>
                        {isSaving ? <Spinner /> : submitLabel}
                    </button>
                    <button className="dashboard-button dashboard-button--outline" disabled={isSaving} type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    {!isNew && (
                        <>
                            {!isMobile && <div style={{ flex: 1 }} />}
                            <button className="dashboard-button dashboard-button--danger" disabled={isSaving} type="button" onClick={onDelete}>
                                {`Delete ${entity}`}
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}
