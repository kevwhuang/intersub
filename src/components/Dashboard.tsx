import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { ErrorBoundary } from '@components/ErrorBoundary';
import { useAuth } from '@lib/auth';
import { formatDate, getDifficultyMeta } from '@lib/utils';

interface AdminOutcome {
    id: string;
    points: string[];
    summary: string;
    title: string;
}

interface AdminSeminar {
    content: string;
    cover?: string;
    date: string;
    difficulty?: string;
    id: string;
    location: string;
    title: string;
}

interface DashboardState {
    activePanel: 'outcomes' | 'seminars';
    adminFilters: string[];
    adminLocation: string;
    adminSearch: string;
    confirmDelete: string | null;
    confirmDeleteType: 'outcome' | 'seminar';
    drawerOpen: boolean;
    editing: string | null;
    editingOutcome: string | null;
    form: SeminarFormData | null;
    formErrors: Record<string, boolean>;
    outcomeForm: OutcomeFormData | null;
    outcomeFormErrors: Record<string, boolean>;
    outcomes: AdminOutcome[];
    seminars: AdminSeminar[];
    sidebarCollapsed: boolean;
    toast: string | null;
    sortDir: 'asc' | 'desc';
    sortKey: string;
}

interface OutcomeFormData {
    points: string;
    summary: string;
    title: string;
}

interface SeminarFormData {
    content: string;
    cover: string;
    date: string;
    difficulty: string;
    location: string;
    title: string;
}

type DashboardAction
    = | { payload: Partial<DashboardState>; type: 'SET' }
        | { payload: (state: DashboardState) => Partial<DashboardState>; type: 'FN' };

const ACCENT = '#2a52e0';
const FONT_HEADING = '\'Space Grotesk\', sans-serif';
const FONT_MONO = '\'IBM Plex Mono\', monospace';

const NAV_ITEMS = [
    { key: 'outcomes', label: 'Outcomes' },
    { key: 'seminars', label: 'Seminars' },
];

const STYLES = {
    border: '1px solid #e4e7ec',
    borderMuted: '1px solid #dfe2e8',
    borderRadius: 10,
    borderRadiusSm: 9,
    borderRadiusLg: 16,
    colorError: '#c0392b',
    colorErrorBorder: '#f0d6dd',
    colorErrorInk: '#a4324a',
    colorGhost: '#878d99',
    colorInk: '#14161c',
    colorMuted: '#4a515e',
    colorRowBorder: '1px solid #f1f2f5',
    inputBase: {
        borderRadius: 10,
        color: '#14161c',
        fontFamily: 'inherit',
        fontSize: 15,
        outline: 'none',
        padding: '12px 14px',
        width: '100%',
    } as React.CSSProperties,
    labelBase: {
        display: 'block' as const,
        fontSize: 13.5,
        fontWeight: 600,
        marginBottom: 7,
    } as React.CSSProperties,
} as const;

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    if (action.type === 'SET') return { ...state, ...action.payload };
    if (action.type === 'FN') return { ...state, ...action.payload(state) };
    return state;
}

function useDashboardState() {
    const [state, dispatch] = useReducer(dashboardReducer, {
        activePanel: 'seminars',
        adminFilters: [],
        adminLocation: 'all',
        adminSearch: '',
        confirmDelete: null,
        confirmDeleteType: 'seminar',
        drawerOpen: typeof window !== 'undefined' && window.innerWidth > 1024,
        editing: null,
        editingOutcome: null,
        form: null,
        formErrors: {},
        outcomeForm: null,
        outcomeFormErrors: {},
        outcomes: [],
        seminars: [],
        sidebarCollapsed: false,
        toast: null,
        sortDir: 'desc',
        sortKey: 'date',
    } satisfies DashboardState);

    const set = useCallback(
        (payload: Partial<DashboardState>) => dispatch({ payload, type: 'SET' }),
        [],
    );

    const update = useCallback(
        (callback: (state: DashboardState) => Partial<DashboardState>) => dispatch({ payload: callback, type: 'FN' }),
        [],
    );

    const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [isMobile, setIsMobile] = useState(false);

    function fetchData() {
        fetch('/api/seminars').then(response => response.json()).then(data => set({ seminars: data })).catch(() => {});
        fetch('/api/outcomes').then(response => response.json()).then(data => set({ outcomes: data })).catch(() => {});
    }

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 1024px)');
        setIsMobile(mediaQuery.matches);
        const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
        mediaQuery.addEventListener('change', onChange);
        return () => mediaQuery.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        return () => {
            clearTimeout(toastTimer.current);
        };
    }, []);

    function showToast(message: string) {
        clearTimeout(toastTimer.current);
        set({ toast: message });
        toastTimer.current = setTimeout(() => set({ toast: null }), 3_000);
    }

    function handleCancelEdit() {
        set({ editing: null, form: null, formErrors: {} });
    }

    function handleResetForLogout() {
        set({ drawerOpen: false, editing: null });
    }

    async function handleSaveForm() {
        if (!state.form) return;
        const errors: Record<string, boolean> = {};
        if (!state.form.title.trim()) errors.title = true;
        if (!state.form.date) errors.date = true;
        if (!state.form.location.trim()) errors.location = true;
        if (!state.form.content.trim()) errors.content = true;
        if (Object.keys(errors).length) {
            set({ formErrors: errors });
            return;
        }

        const isNew = state.editing === 'new';
        const body: Record<string, string> = { ...state.form };

        if (!isNew && state.editing) body.id = state.editing;

        try {
            await fetch('/api/seminars', {
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });
            set({ editing: null, form: null, formErrors: {} });
            fetchData();
            showToast(isNew ? 'Seminar created' : 'Changes saved');
        } catch {
            showToast('Failed to save');
        }
    }

    function handleStartEdit(id: string) {
        const seminar = state.seminars.find(item => item.id === id);
        if (seminar) {
            set({
                editing: id,
                form: { content: seminar.content, cover: seminar.cover || '', date: seminar.date, difficulty: seminar.difficulty || '', location: seminar.location, title: seminar.title },
                formErrors: {},
            });
        }
    }

    function handleStartNew() {
        set({ editing: 'new', form: { content: '', cover: '', date: '', difficulty: 'beginner', location: '', title: '' }, formErrors: {} });
    }

    function handleToggleNav() {
        set({ drawerOpen: !state.drawerOpen });
    }

    function handleCancelOutcomeEdit() {
        set({ editingOutcome: null, outcomeForm: null, outcomeFormErrors: {} });
    }

    async function handleSaveOutcome() {
        if (!state.outcomeForm) return;
        const errors: Record<string, boolean> = {};
        if (!state.outcomeForm.title.trim()) errors.title = true;
        if (!state.outcomeForm.summary.trim()) errors.summary = true;
        if (Object.keys(errors).length) {
            set({ outcomeFormErrors: errors });
            return;
        }

        const isNew = state.editingOutcome === 'new';
        const points = state.outcomeForm.points.split('\n').map(line => line.trim()).filter(Boolean);
        const body: Record<string, string | string[]> = { points, summary: state.outcomeForm.summary, title: state.outcomeForm.title };

        if (!isNew && state.editingOutcome) body.id = state.editingOutcome;

        try {
            await fetch('/api/outcomes', { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' });
            set({ editingOutcome: null, outcomeForm: null, outcomeFormErrors: {} });
            fetchData();
            showToast(isNew ? 'Outcome created' : 'Changes saved');
        } catch {
            showToast('Failed to save');
        }
    }

    function handleStartOutcomeEdit(id: string) {
        const outcome = state.outcomes.find(item => item.id === id);
        if (outcome) {
            set({ editingOutcome: id, outcomeForm: { points: outcome.points.join('\n'), summary: outcome.summary, title: outcome.title }, outcomeFormErrors: {} });
        }
    }

    function handleStartNewOutcome() {
        set({ editingOutcome: 'new', outcomeForm: { points: '', summary: '', title: '' }, outcomeFormErrors: {} });
    }

    function handleUpdateOutcomeForm(fields: Partial<OutcomeFormData>) {
        update((previous) => {
            if (!previous.outcomeForm) return {};
            return {
                outcomeForm: { ...previous.outcomeForm, ...fields },
                outcomeFormErrors: { ...previous.outcomeFormErrors, ...Object.fromEntries(Object.keys(fields).map(key => [key, false])) },
            };
        });
    }

    function handleUpdateForm(fields: Partial<SeminarFormData>) {
        update((previous) => {
            if (!previous.form) return {};
            return {
                form: { ...previous.form, ...fields },
                formErrors: { ...previous.formErrors, ...Object.fromEntries(Object.keys(fields).map(key => [key, false])) },
            };
        });
    }

    return {
        fetchData,
        handleCancelEdit,
        handleCancelOutcomeEdit,
        handleResetForLogout,
        handleSaveForm,
        handleSaveOutcome,
        handleStartEdit,
        handleStartNew,
        handleStartNewOutcome,
        handleStartOutcomeEdit,
        handleToggleNav,
        handleUpdateForm,
        handleUpdateOutcomeForm,
        isMobile,
        set,
        showToast,
        state,
        update,
    };
}

function AdminForm({ editing, form, formErrors, isMobile, onCancel, onDelete, onSave, onUpdate }: {
    editing: string;
    form: SeminarFormData;
    formErrors: Record<string, boolean>;
    isMobile: boolean;
    onCancel: () => void;
    onDelete: () => void;
    onSave: () => void;
    onUpdate: (fields: Partial<SeminarFormData>) => void;
}) {
    function errorBorder(field: string) {
        return formErrors[field] ? '#e0a0a0' : '#dfe2e8';
    }

    return (
        <div style={{ margin: '0 auto', maxWidth: 760 }}>
            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 28px' }}>
                {editing === 'new' ? 'New seminar' : 'Edit seminar'}
            </h1>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSave();
                }}
                style={{ background: '#ffffff', border: STYLES.border, borderRadius: STYLES.borderRadiusLg, display: 'flex', flexDirection: 'column', gap: 20, padding: 'clamp(20px, 3.5vw, 40px)' }}
            >
                <FormField errorMessage={formErrors.title ? 'Title is required.' : undefined} label="Title" required>
                    <input className="dashboard-input" value={form.title} onChange={event => onUpdate({ title: event.target.value })} placeholder="e.g. Executive Presence in English Meetings" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('title')}` }} />
                </FormField>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                    <FormField errorMessage={formErrors.date ? 'Date is required.' : undefined} label="Date" required>
                        <input className="dashboard-input" value={form.date} onChange={event => onUpdate({ date: event.target.value })} type="date" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('date')}`, padding: '11px 14px' }} />
                    </FormField>
                    <FormField label="Difficulty">
                        <select className="dashboard-input" value={form.difficulty} onChange={event => onUpdate({ difficulty: event.target.value })} style={{ ...STYLES.inputBase, background: '#ffffff', border: STYLES.borderMuted, cursor: 'pointer', padding: '11px 14px' }}>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </FormField>
                </div>
                <FormField errorMessage={formErrors.location ? 'Location is required.' : undefined} label="Location" required>
                    <input className="dashboard-input" value={form.location} onChange={event => onUpdate({ location: event.target.value })} placeholder="e.g. Shanghai" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('location')}` }} />
                </FormField>
                <FormField label="Cover">
                    <input className="dashboard-input" value={form.cover} onChange={event => onUpdate({ cover: event.target.value })} placeholder="https://…" style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                </FormField>
                <FormField errorMessage={formErrors.content ? 'Content is required.' : undefined} label="Content" labelSuffix="· Markdown" required>
                    <textarea className="dashboard-input" value={form.content} onChange={event => onUpdate({ content: event.target.value })} rows={9} placeholder={'Intro paragraph…\n\n## What you\'ll learn\n- Point one\n- Point two'} style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('content')}`, fontFamily: FONT_MONO, fontSize: 13.5, lineHeight: 1.6, minHeight: 200, resize: 'vertical' as const }} />
                </FormField>
                <div style={{ borderTop: '1px solid #eceef2', display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                    <button className="dashboard-button--primary" type="submit">
                        {editing === 'new' ? 'Create seminar' : 'Save changes'}
                    </button>
                    <button className="dashboard-button--outline" type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    {editing !== 'new' && (
                        <>
                            <div style={{ flex: 1 }} />
                            <button className="dashboard-button--danger" type="button" onClick={onDelete}>
                                Delete seminar
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}

function AdminSidebar({ activePanel, drawerOpen, isMobile, onCloseDrawer, onLogout, onSelectPanel }: {
    activePanel: string;
    drawerOpen: boolean;
    isMobile: boolean;
    onCloseDrawer: () => void;
    onLogout: () => void;
    onSelectPanel: (key: string) => void;
}) {
    const sidebarStyle: React.CSSProperties = isMobile
        ? { background: '#ffffff', borderRight: STYLES.border, bottom: 0, boxShadow: drawerOpen ? '0 16px 40px rgba(20,22,28,.18)' : 'none', display: 'flex', flexDirection: 'column', left: 0, position: 'fixed', top: 60, transform: drawerOpen ? 'translateX(0)' : 'translateX(-110%)', transition: 'transform .2s ease', width: 240, zIndex: 35 }
        : { alignSelf: 'flex-start', background: '#ffffff', borderRight: STYLES.border, display: 'flex', flex: 'none', flexDirection: 'column', height: 'calc(100vh - 60px)', marginLeft: drawerOpen ? 0 : -240, overflow: 'auto', position: 'sticky', top: 60, transition: 'margin-left .2s ease', width: 240 };

    return (
        <aside style={sidebarStyle}>
            <a className="dashboard-link" href="/" style={{ borderBottom: '1px solid #eceef2', color: STYLES.colorGhost, display: 'block', fontSize: 12.5, fontWeight: 600, padding: '14px 24px' }}>&larr; Back to site</a>
            <nav style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, padding: '14px 12px' }}>
                {NAV_ITEMS.map((item) => {
                    const active = item.key === activePanel;
                    return (
                        <button
                            className="dashboard-nav"
                            key={item.key}
                            onClick={() => {
                                onSelectPanel(item.key);
                                if (isMobile) onCloseDrawer();
                            }}
                            style={{ alignItems: 'center', background: active ? `color-mix(in srgb, ${ACCENT} 10%, #fff)` : 'transparent', border: 'none', borderRadius: STYLES.borderRadiusSm, color: active ? ACCENT : '#3f4654', display: 'flex', fontSize: 14, fontWeight: 600, gap: 12, overflow: 'hidden', padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', width: '100%' }}
                        >
                            <span style={{ background: active ? `color-mix(in srgb, ${ACCENT} 22%, #fff)` : 'transparent', border: `1.7px solid ${active ? ACCENT : STYLES.colorGhost}`, borderRadius: 5, flex: 'none', height: 18, width: 18 }} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div style={{ borderTop: '1px solid #eceef2', padding: '14px 12px' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px' }}>
                    <span style={{ alignItems: 'center', background: ACCENT, borderRadius: '50%', color: '#ffffff', display: 'flex', flex: 'none', fontFamily: FONT_HEADING, fontSize: 16, fontWeight: 600, height: 44, justifyContent: 'center', width: 44 }}>LZ</span>
                    <button className="dashboard-button--ghost" onClick={onLogout} style={{ color: STYLES.colorGhost, fontSize: 12, fontWeight: 500, padding: 0 }}>
                        Sign out
                    </button>
                </div>
            </div>
        </aside>
    );
}

function AdminTopBar({ onToggleNav, searchValue, onSearchChange }: {
    onSearchChange: (value: string) => void;
    onToggleNav: () => void;
    searchValue: string;
}) {
    return (
        <header style={{ alignItems: 'center', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,.9)', borderBottom: STYLES.border, display: 'flex', flex: 'none', gap: 14, height: 60, padding: '0 16px', position: 'sticky', top: 0, zIndex: 40 }}>
            <button className="dashboard-button--ghost" aria-label="Toggle navigation" onClick={onToggleNav} style={{ alignItems: 'center', border: STYLES.border, borderRadius: STYLES.borderRadiusSm, display: 'flex', flex: 'none', height: 38, justifyContent: 'center', width: 38 }}>
                <span style={{ background: STYLES.colorInk, boxShadow: `0 -5px 0 ${STYLES.colorInk}, 0 5px 0 ${STYLES.colorInk}`, display: 'block', height: 1.6, width: 16 }} />
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
                <input className="dashboard-input" value={searchValue} onChange={event => onSearchChange(event.target.value)} placeholder="Search…" style={{ background: '#f7f8fa', border: STYLES.border, borderRadius: STYLES.borderRadiusSm, color: STYLES.colorInk, fontSize: 14, padding: '9px 12px 9px 14px', width: '100%' }} />
            </div>
        </header>
    );
}

function DeleteModal({ onCancel, onConfirm, title }: {
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
}) {
    function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget) onCancel();
    }

    function handleBackdropKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Escape') onCancel();
    }

    return (
        <div role="button" tabIndex={-1} onClick={handleBackdropClick} onKeyDown={handleBackdropKeyDown} style={{ alignItems: 'center', background: 'rgba(20,22,28,.45)', display: 'flex', inset: 0, justifyContent: 'center', padding: 24, position: 'fixed', zIndex: 60 }}>
            <div role="dialog" aria-labelledby="delete-modal-title" style={{ background: '#ffffff', borderRadius: STYLES.borderRadiusLg, boxShadow: '0 24px 60px rgba(20,22,28,.25)', maxWidth: 400, padding: 'clamp(20px, 4vw, 30px)', width: '100%' }}>
                <h3 id="delete-modal-title" style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 10px' }}>Delete this seminar?</h3>
                <p style={{ color: STYLES.colorMuted, fontSize: 14.5, lineHeight: 1.55, margin: '0 0 24px' }}>
                    &ldquo;
                    {title}
                    &rdquo; will be permanently deleted. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="dashboard-button--outline" onClick={onCancel} style={{ borderRadius: STYLES.borderRadiusSm, fontSize: 14, padding: '10px 18px' }}>
                        Cancel
                    </button>
                    <button className="dashboard-button--danger" onClick={onConfirm} style={{ background: STYLES.colorError, borderColor: STYLES.colorError, borderRadius: STYLES.borderRadiusSm, color: '#ffffff', fontSize: 14, padding: '10px 18px' }}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function FilterChips({ activeFilters, activeLocation, locations, onFilterToggle, onLocationChange, onNewSeminar }: {
    activeFilters: string[];
    activeLocation: string;
    locations: string[];
    onFilterToggle: (value: string) => void;
    onLocationChange: (value: string) => void;
    onNewSeminar: () => void;
}) {
    function chipClassName(active: boolean) {
        return active ? 'dashboard-chip dashboard-chip--active' : 'dashboard-chip';
    }

    const groupLabelStyle: React.CSSProperties = { color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '.08em', margin: '0 0 8px', textTransform: 'uppercase' };

    return (
        <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                    <p style={groupLabelStyle}>Location</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {['all', ...locations].map(location => (
                            <button className={chipClassName(activeLocation === location)} key={location} onClick={() => onLocationChange(location)}>
                                {location === 'all' ? 'All locations' : location}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p style={groupLabelStyle}>Level</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button className={chipClassName(activeFilters.length === 0)} onClick={() => onFilterToggle('all')}>
                            All levels
                        </button>
                        {['beginner', 'intermediate', 'advanced'].map(difficulty => (
                            <button className={chipClassName(activeFilters.includes(difficulty))} key={difficulty} onClick={() => onFilterToggle(difficulty)}>
                                {getDifficultyMeta(difficulty).label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button className="dashboard-button--primary" onClick={onNewSeminar} style={{ alignItems: 'center', display: 'inline-flex', fontSize: 14, gap: 6, padding: '10px 16px', whiteSpace: 'nowrap' }}>
                +&ensp;New seminar
            </button>
        </div>
    );
}

function FormField({ children, errorMessage, label, labelSuffix, required }: {
    children: React.ReactNode;
    errorMessage?: string;
    label: string;
    labelSuffix?: string;
    required?: boolean;
}) {
    return (
        <label style={{ display: 'block' }}>
            <span style={STYLES.labelBase}>
                {label}
                {labelSuffix && (
                    <span style={{ color: STYLES.colorGhost, fontWeight: 500 }}>
                        {' '}
                        {labelSuffix}
                    </span>
                )}
                {required && <span style={{ color: ACCENT }}> *</span>}
            </span>
            {children}
            {errorMessage && <p style={{ color: STYLES.colorError, fontSize: 12.5, margin: '6px 0 0' }}>{errorMessage}</p>}
        </label>
    );
}

function LoginScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div style={{ alignItems: 'center', background: '#f7f8fa', display: 'flex', fontFamily: '\'Hanken Grotesk\', sans-serif', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
            <div style={{ maxWidth: 380, width: '100%' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                    <span style={{ background: ACCENT, borderRadius: 10, display: 'inline-block', height: 36, width: 36 }} />
                    <span style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>InterSub</span>
                </div>
                <div style={{ background: '#ffffff', border: STYLES.border, borderRadius: 16, boxShadow: '0 1px 3px rgba(20,22,28,.04), 0 10px 40px rgba(20,22,28,.06)', padding: 'clamp(24px, 4vw, 32px) clamp(20px, 3.5vw, 28px)' }}>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 4px', textAlign: 'center' }}>Sign in</h1>
                    <p style={{ color: STYLES.colorGhost, fontSize: 13.5, lineHeight: 1.5, margin: '0 0 24px', textAlign: 'center' }}>Secured with Netlify Identity.</p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            auth.handleLogin(email, password);
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                        <div>
                            <label htmlFor="dashboard-email" style={STYLES.labelBase}>Email</label>
                            <input className="dashboard-input" id="dashboard-email" value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="lydia@intersubstudio.com" style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                        </div>
                        <div>
                            <label htmlFor="dashboard-password" style={STYLES.labelBase}>Password</label>
                            <input className="dashboard-input" id="dashboard-password" value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="••••••••" style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                        </div>
                        {auth.error && <p style={{ color: STYLES.colorError, fontSize: 13, margin: 0 }}>{auth.error}</p>}
                        <button className="dashboard-button--primary" type="submit" style={{ fontSize: 15, marginTop: 6, padding: '13px 0' }}>Sign in</button>
                    </form>
                </div>
                <a className="dashboard-link" href="/" style={{ color: STYLES.colorGhost, display: 'block', fontSize: 13, marginTop: 20, textAlign: 'center' }}>&larr; Back to site</a>
            </div>
        </div>
    );
}

function SeminarRow({ isMobile, onDelete, onEdit, seminar }: {
    isMobile: boolean;
    onDelete: () => void;
    onEdit: () => void;
    seminar: AdminSeminar;
}) {
    const meta = seminar.difficulty ? getDifficultyMeta(seminar.difficulty) : null;
    const tagStyle: React.CSSProperties | null = meta ? { background: meta.bg, borderRadius: 6, color: meta.fg, fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 500, letterSpacing: '.04em', padding: '4px 9px', textTransform: 'uppercase', whiteSpace: 'nowrap' } : null;
    const actionStyle: React.CSSProperties = { borderRadius: 8, fontSize: 13, padding: '7px 12px' };

    if (isMobile) {
        return (
            <div style={{ borderBottom: STYLES.colorRowBorder, display: 'flex', flexDirection: 'column', gap: 10, padding: '16px clamp(14px, 2.5vw, 22px)' }}>
                <div>
                    <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{seminar.title}</p>
                    <div style={{ alignItems: 'center', color: STYLES.colorMuted, display: 'flex', fontSize: 13.5, gap: 8, marginTop: 6 }}>
                        <span>{formatDate(seminar.date)}</span>
                        <span aria-hidden="true">&middot;</span>
                        <span>{seminar.location}</span>
                    </div>
                </div>
                {meta && <span style={{ ...tagStyle!, alignSelf: 'flex-start' }}>{meta.label}</span>}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button className="dashboard-button--outline" onClick={onEdit} style={actionStyle}>Edit</button>
                    <button className="dashboard-button--danger" onClick={onDelete} style={actionStyle}>Delete</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 130px 130px', padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{seminar.title}</p>
                <p style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    /
                    {seminar.id}
                </p>
            </div>
            <span style={{ color: STYLES.colorMuted, fontSize: 14, whiteSpace: 'nowrap' }}>{formatDate(seminar.date)}</span>
            <span style={{ color: STYLES.colorMuted, fontSize: 14 }}>{seminar.location}</span>
            <span>{meta && <span style={tagStyle!}>{meta.label}</span>}</span>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button className="dashboard-button--outline" onClick={onEdit} style={actionStyle}>Edit</button>
                <button className="dashboard-button--danger" onClick={onDelete} style={actionStyle}>Delete</button>
            </div>
        </div>
    );
}

function TableHeader({ onSortByDate, onSortByTitle, sortDir, sortKey }: {
    onSortByDate: () => void;
    onSortByTitle: () => void;
    sortDir: string;
    sortKey: string;
}) {
    function sortArrow(field: string) {
        return sortKey === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    }

    const headerStyle: React.CSSProperties = { alignItems: 'center', color: STYLES.colorGhost, display: 'flex', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, gap: 5, justifyContent: 'flex-start', letterSpacing: '.08em', padding: 0, textAlign: 'left', textTransform: 'uppercase' };
    const labelStyle: React.CSSProperties = { color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' };

    return (
        <div style={{ alignItems: 'center', background: '#fafbfc', borderBottom: '1px solid #eceef2', display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 130px 130px', padding: 'clamp(10px, 2vw, 13px) clamp(14px, 2.5vw, 22px)' }}>
            <button className="dashboard-button--ghost" onClick={onSortByTitle} style={headerStyle}>
                Title
                {sortArrow('title')}
            </button>
            <button className="dashboard-button--ghost" onClick={onSortByDate} style={headerStyle}>
                Date
                {sortArrow('date')}
            </button>
            <span style={labelStyle}>Location</span>
            <span style={labelStyle}>Level</span>
            <span style={{ ...labelStyle, textAlign: 'right', width: '100%' }}>Actions</span>
        </div>
    );
}

function OutcomesPanel({ editingOutcome, isMobile, onCancelEdit, onSave, onStartEdit, onStartNew, onUpdate, outcomeForm, outcomeFormErrors, outcomes, set }: {
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
                    <FormField label="Outcomes" labelSuffix="· one per line">
                        <textarea className="dashboard-input" value={outcomeForm.points} onChange={event => onUpdate({ points: event.target.value })} rows={5} placeholder={'Now lead calls end-to-end in English\nFollow-up emails dropped by half'} style={{ ...STYLES.inputBase, border: STYLES.borderMuted, fontFamily: FONT_MONO, fontSize: 13.5, lineHeight: 1.6, minHeight: 140, resize: 'vertical' as const }} />
                    </FormField>
                    <div style={{ borderTop: '1px solid #eceef2', display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                        <button className="dashboard-button--primary" type="submit">
                            {editingOutcome === 'new' ? 'Create outcome' : 'Save changes'}
                        </button>
                        <button className="dashboard-button--outline" type="button" onClick={onCancelEdit}>
                            Cancel
                        </button>
                        {editingOutcome !== 'new' && (
                            <>
                                <div style={{ flex: 1 }} />
                                <button className="dashboard-button--danger" type="button" onClick={() => set({ confirmDelete: editingOutcome, confirmDeleteType: 'outcome' })}>
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
                                                <span style={{ color: STYLES.colorGhost, fontFamily: FONT_MONO, fontSize: 11, marginTop: 6, display: 'block' }}>
                                                    {outcome.points.length}
                                                    {' '}
                                                    {outcome.points.length === 1 ? 'outcome' : 'outcomes'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="dashboard-button--outline" onClick={() => onStartEdit(outcome.id)} style={actionStyle}>Edit</button>
                                                <button className="dashboard-button--danger" onClick={() => set({ confirmDelete: outcome.id, confirmDeleteType: 'outcome' })} style={actionStyle}>Delete</button>
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
                                <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Create your first outcome to showcase client results.</p>
                            </div>
                        )}
            </div>
        </div>
    );
}

function DashboardInner() {
    const auth = useAuth();
    const {
        fetchData,
        handleCancelEdit,
        handleCancelOutcomeEdit,
        handleResetForLogout,
        handleSaveForm,
        handleSaveOutcome,
        handleStartEdit,
        handleStartNew,
        handleStartNewOutcome,
        handleStartOutcomeEdit,
        handleToggleNav,
        handleUpdateForm,
        handleUpdateOutcomeForm,
        isMobile,
        set,
        showToast,
        state,
    } = useDashboardState();

    if (auth.loading) {
        return (
            <div style={{ alignItems: 'center', display: 'flex', fontFamily: '\'Hanken Grotesk\', sans-serif', justifyContent: 'center', minHeight: '100vh' }}>
                <p style={{ color: STYLES.colorGhost, fontSize: 14 }}>Loading&hellip;</p>
            </div>
        );
    }

    if (!auth.user) {
        return <LoginScreen auth={auth} />;
    }

    const query = state.adminSearch.trim().toLowerCase();
    const direction = state.sortDir === 'asc' ? 1 : -1;

    const filteredOutcomes = query
        ? state.outcomes.filter(outcome => outcome.title.toLowerCase().includes(query) || outcome.summary.toLowerCase().includes(query))
        : state.outcomes;

    const filteredRows = state.seminars
        .filter(seminar =>
            (state.adminFilters.length === 0 || state.adminFilters.includes(seminar.difficulty || ''))
            && (state.adminLocation === 'all' || seminar.location === state.adminLocation)
            && (!query || seminar.title.toLowerCase().includes(query) || seminar.location.toLowerCase().includes(query)),
        )
        .slice()
        .sort((a, b) => {
            const valueA = state.sortKey === 'date' ? a.date : a.title.toLowerCase();
            const valueB = state.sortKey === 'date' ? b.date : b.title.toLowerCase();
            return valueA < valueB ? -direction : valueA > valueB ? direction : 0;
        });

    const confirmItem = state.confirmDelete
        ? (state.confirmDeleteType === 'outcome'
                ? state.outcomes.find(outcome => outcome.id === state.confirmDelete)
                : state.seminars.find(seminar => seminar.id === state.confirmDelete))
        : null;

    function handleToggleSort(field: string) {
        set({ sortDir: state.sortKey === field && state.sortDir === 'asc' ? 'desc' : 'asc', sortKey: field });
    }

    return (
        <div style={{ background: '#f7f8fa', display: 'flex', flexDirection: 'column', fontFamily: '\'Hanken Grotesk\', sans-serif', minHeight: '100vh' }}>
            <AdminTopBar
                onSearchChange={value => set({ adminSearch: value })}
                onToggleNav={handleToggleNav}
                searchValue={state.adminSearch}
            />
            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                {isMobile && state.drawerOpen && <div aria-hidden="true" onClick={() => set({ drawerOpen: false })} style={{ background: 'rgba(20,22,28,.35)', inset: '60px 0 0 0', position: 'fixed', zIndex: 30 }} />}
                <AdminSidebar
                    activePanel={state.activePanel}
                    drawerOpen={state.drawerOpen}
                    isMobile={isMobile}
                    onCloseDrawer={() => set({ drawerOpen: false })}
                    onLogout={() => {
                        auth.handleLogout();
                        handleResetForLogout();
                    }}
                    onSelectPanel={key => set({ activePanel: key as DashboardState['activePanel'], editing: null, editingOutcome: null, form: null, outcomeForm: null })}
                />
                <main style={{ flex: 1, minWidth: 0, padding: 'clamp(20px, 4vw, 48px) clamp(16px, 3vw, 40px)' }}>
                    {state.activePanel === 'outcomes'
                        ? (
                                <OutcomesPanel
                                    editingOutcome={state.editingOutcome}
                                    isMobile={isMobile}
                                    onCancelEdit={handleCancelOutcomeEdit}
                                    onSave={handleSaveOutcome}
                                    onStartEdit={handleStartOutcomeEdit}
                                    onStartNew={handleStartNewOutcome}
                                    onUpdate={handleUpdateOutcomeForm}
                                    outcomeForm={state.outcomeForm}
                                    outcomeFormErrors={state.outcomeFormErrors}
                                    outcomes={filteredOutcomes}
                                    set={set}
                                />
                            )
                        : state.editing === null
                            ? (
                                    <div style={{ margin: '0 auto', maxWidth: 1280 }}>
                                        <div style={{ marginBottom: 24 }}>
                                            <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Seminars</h1>
                                            <div style={{ color: STYLES.colorGhost, display: 'flex', flexWrap: 'wrap', fontFamily: FONT_MONO, fontSize: 12, gap: '4px 8px', letterSpacing: '.06em' }}>
                                                <span>
                                                    {state.seminars.length}
                                                    {' '}
                                                    {state.seminars.length === 1 ? 'seminar' : 'seminars'}
                                                </span>
                                                <span aria-hidden="true">&middot;</span>
                                                <span>
                                                    {[...new Set(state.seminars.map(seminar => seminar.location))].length}
                                                    {' '}
                                                    {[...new Set(state.seminars.map(seminar => seminar.location))].length === 1 ? 'location' : 'locations'}
                                                </span>
                                                <span aria-hidden="true">&middot;</span>
                                                <span>
                                                    {state.seminars.filter(seminar => seminar.difficulty === 'beginner').length}
                                                    {' '}
                                                    beginner
                                                </span>
                                                <span aria-hidden="true">&middot;</span>
                                                <span>
                                                    {state.seminars.filter(seminar => seminar.difficulty === 'intermediate').length}
                                                    {' '}
                                                    intermediate
                                                </span>
                                                <span aria-hidden="true">&middot;</span>
                                                <span>
                                                    {state.seminars.filter(seminar => seminar.difficulty === 'advanced').length}
                                                    {' '}
                                                    advanced
                                                </span>
                                            </div>
                                        </div>
                                        <FilterChips
                                            activeFilters={state.adminFilters}
                                            activeLocation={state.adminLocation}
                                            locations={[...new Set(state.seminars.map(seminar => seminar.location))].sort()}
                                            onFilterToggle={(value) => {
                                                if (value === 'all') {
                                                    set({ adminFilters: [] });
                                                } else {
                                                    set({
                                                        adminFilters: state.adminFilters.includes(value)
                                                            ? state.adminFilters.filter(filter => filter !== value)
                                                            : [...state.adminFilters, value],
                                                    });
                                                }
                                            }}
                                            onLocationChange={value => set({ adminLocation: value })}
                                            onNewSeminar={handleStartNew}
                                        />
                                        <div style={{ background: '#ffffff', border: STYLES.border, borderRadius: 14, overflow: 'auto' }}>
                                            {!isMobile && (
                                                <TableHeader
                                                    onSortByDate={() => handleToggleSort('date')}
                                                    onSortByTitle={() => handleToggleSort('title')}
                                                    sortDir={state.sortDir}
                                                    sortKey={state.sortKey}
                                                />
                                            )}
                                            {filteredRows.length > 0
                                                ? filteredRows.map(seminar => (
                                                        <SeminarRow
                                                            isMobile={isMobile}
                                                            key={seminar.id}
                                                            onDelete={() => set({ confirmDelete: seminar.id, confirmDeleteType: 'seminar' })}
                                                            onEdit={() => handleStartEdit(seminar.id)}
                                                            seminar={seminar}
                                                        />
                                                    ))
                                                : (
                                                        <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                                                            <p style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>No seminars found</p>
                                                            <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Adjust your search or filters, or create a new seminar.</p>
                                                        </div>
                                                    )}
                                        </div>
                                    </div>
                                )
                            : state.form
                                ? (
                                        <AdminForm
                                            editing={state.editing}
                                            form={state.form}
                                            formErrors={state.formErrors}
                                            isMobile={isMobile}
                                            onCancel={handleCancelEdit}
                                            onDelete={() => set({ confirmDelete: state.editing, confirmDeleteType: 'seminar' })}
                                            onSave={handleSaveForm}
                                            onUpdate={handleUpdateForm}
                                        />
                                    )
                                : null}
                </main>
            </div>
            {state.confirmDelete && confirmItem && (
                <DeleteModal
                    onCancel={() => set({ confirmDelete: null })}
                    onConfirm={async () => {
                        const id = state.confirmDelete;
                        const endpoint = state.confirmDeleteType === 'outcome' ? '/api/outcomes' : '/api/seminars';
                        const label = state.confirmDeleteType === 'outcome' ? 'Outcome' : 'Seminar';
                        set({ confirmDelete: null, editing: null, editingOutcome: null, form: null, outcomeForm: null });
                        try {
                            await fetch(endpoint, { body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' }, method: 'DELETE' });
                            fetchData();
                            showToast(`${label} deleted`);
                        } catch {
                            showToast('Failed to delete');
                        }
                    }}
                    title={confirmItem.title}
                />
            )}
            {state.toast && (
                <div aria-live="polite" role="status" style={{ alignItems: 'center', animation: 'is-toast-in .3s ease both', background: '#e7f4ef', border: '1px solid #0d7a5f', borderRadius: 12, bottom: 36, boxShadow: '0 8px 24px rgba(20,22,28,.16)', color: '#0d7a5f', display: 'flex', fontFamily: '\'Hanken Grotesk\', sans-serif', fontSize: 15, fontWeight: 600, gap: 10, left: '50%', maxWidth: 'calc(100vw - 48px)', padding: 'clamp(12px, 2vw, 14px) clamp(16px, 3vw, 24px)', position: 'fixed', transform: 'translateX(-50%)', whiteSpace: 'nowrap', zIndex: 50 }}>
                    {state.toast}
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    return (
        <ErrorBoundary>
            <DashboardInner />
        </ErrorBoundary>
    );
}
