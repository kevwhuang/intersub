import FormField from '@components/FormField';
import Spinner from '@components/Spinner';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';

export default function AdminForm({ editing, form, formErrors, isMobile, onCancel, onDelete, onSave, onUpdate, saving }: {
    editing: string;
    form: EventFormData;
    formErrors: Record<string, boolean>;
    isMobile: boolean;
    onCancel: () => void;
    onDelete: () => void;
    onSave: () => void;
    onUpdate: (fields: Partial<EventFormData>) => void;
    saving: boolean;
}) {
    function errorBorder(field: string) {
        return formErrors[field] ? STYLES.colorErrorSoft : STYLES.colorBorder;
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: 760 }}>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 28px' }}>
                {editing === 'new' ? 'New event' : 'Edit event'}
            </h1>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSave();
                }}
                style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: STYLES.borderRadiusLg, display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(20px, 3.5vw, 40px)' }}
            >
                <FormField errorId="error-title" errorMessage={formErrors.title ? 'Title is required.' : undefined} label="Title" required>
                    <input className="dashboard-input" aria-describedby={formErrors.title ? 'error-title' : undefined} value={form.title} onChange={event => onUpdate({ title: event.target.value })} placeholder="e.g. Executive Presence in English Meetings" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('title')}` }} />
                </FormField>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                    <FormField errorId="error-date" errorMessage={formErrors.date ? 'Date is required.' : undefined} label="Date" required>
                        <input className="dashboard-input" aria-describedby={formErrors.date ? 'error-date' : undefined} value={form.date} onChange={event => onUpdate({ date: event.target.value })} type="date" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('date')}`, padding: '11px 14px' }} />
                    </FormField>
                    <FormField label="Who">
                        <select className="dashboard-input" value={form.level} onChange={event => onUpdate({ level: event.target.value })} style={{ ...STYLES.inputBase, background: STYLES.colorSurface, border: STYLES.borderMuted, padding: '11px 14px' }}>
                            <option value="">None</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Cohort">Cohort</option>
                        </select>
                    </FormField>
                </div>
                <FormField errorId="error-location" errorMessage={formErrors.location ? 'Location is required.' : undefined} label="Location" required>
                    <input className="dashboard-input" aria-describedby={formErrors.location ? 'error-location' : undefined} value={form.location} onChange={event => onUpdate({ location: event.target.value })} placeholder="e.g. Shanghai" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('location')}` }} />
                </FormField>
                <FormField errorId="error-cover" errorMessage={formErrors.cover ? 'Must be a valid URL.' : undefined} label="Cover">
                    <input className="dashboard-input" aria-describedby={formErrors.cover ? 'error-cover' : undefined} value={form.cover} onChange={event => onUpdate({ cover: event.target.value })} placeholder="https://…" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('cover')}` }} />
                </FormField>
                <FormField errorId="error-content" errorMessage={formErrors.content ? 'Content is required.' : undefined} label="Content" labelSuffix="· Markdown" required>
                    <textarea className="dashboard-input" aria-describedby={formErrors.content ? 'error-content' : undefined} value={form.content} onChange={event => onUpdate({ content: event.target.value })} rows={9} placeholder={'Describe what the event covers and who it serves.\n\n## What you\'ll learn\n- First key takeaway or skill\n- Second key takeaway or skill\n- Third key takeaway or skill\n\n## Who it\'s for\nThe target audience and their typical challenges.'} style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('content')}`, fontFamily: FONT_MONO, fontSize: 12, lineHeight: 1.6, minHeight: 200, resize: 'vertical' as const }} />
                </FormField>
                <div style={{ borderTop: `1px solid ${STYLES.colorBorder}`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                    <button className="dashboard-button--primary" disabled={saving} type="submit" style={{ alignItems: 'center', display: 'inline-flex', justifyContent: 'center', minHeight: 44, minWidth: isMobile ? undefined : 150 }}>
                        {saving ? <Spinner /> : editing === 'new' ? 'Create event' : 'Save changes'}
                    </button>
                    <button className="dashboard-button--outline" disabled={saving} type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    {editing !== 'new' && (
                        <>
                            {!isMobile && <div style={{ flex: 1 }} />}
                            <button className="dashboard-button--danger" disabled={saving} type="button" onClick={onDelete}>
                                Delete event
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}
