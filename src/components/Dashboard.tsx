import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { DeleteModal } from '@components/DeleteModal';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { FormField } from '@components/FormField';
import { Spinner } from '@components/Spinner';
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

interface AdminTestimonial {
    id: string;
    industry: string;
    name: string;
    quote: string;
    role: string;
}

interface DashboardState {
    activePanel: 'outcomes' | 'seminars' | 'testimonials';
    adminFilters: string[];
    adminLocation: string;
    adminSearch: string;
    confirmDelete: string | null;
    confirmDeleteType: 'outcome' | 'seminar' | 'testimonial';
    drawerOpen: boolean;
    editing: string | null;
    editingOutcome: string | null;
    editingTestimonial: string | null;
    form: SeminarFormData | null;
    formErrors: Record<string, boolean>;
    loading: boolean;
    outcomeForm: OutcomeFormData | null;
    outcomeFormErrors: Record<string, boolean>;
    outcomes: AdminOutcome[];
    saving: boolean;
    seminars: AdminSeminar[];
    sidebarCollapsed: boolean;
    testimonialForm: TestimonialFormData | null;
    testimonialFormErrors: Record<string, boolean>;
    testimonials: AdminTestimonial[];
    toast: string | null;
    toastError: boolean;
    sortDir: 'asc' | 'desc';
    sortKey: string;
}

interface OutcomeFormData {
    points: string;
    summary: string;
    title: string;
}

interface TestimonialFormData {
    industry: string;
    name: string;
    quote: string;
    role: string;
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
    { key: 'testimonials', label: 'Testimonials' },
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
    colorGhost: '#6e7482',
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

function useDashboardState(getToken: () => Promise<string | null>) {
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
        editingTestimonial: null,
        form: null,
        formErrors: {},
        loading: true,
        outcomeForm: null,
        outcomeFormErrors: {},
        outcomes: [],
        saving: false,
        seminars: [],
        sidebarCollapsed: false,
        testimonialForm: null,
        testimonialFormErrors: {},
        testimonials: [],
        toast: null,
        toastError: false,
        sortDir: 'asc',
        sortKey: 'name',
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

    async function authFetch(url: string, options: RequestInit) {
        const token = await getToken();
        const headers = { ...options.headers as Record<string, string> };

        if (token) headers['Authorization'] = `Bearer ${token}`;

        return fetch(url, { ...options, headers });
    }

    async function fetchData() {
        try {
            const [outcomesResponse, seminarsResponse, testimonialsResponse] = await Promise.all([
                fetch('/api/outcomes'),
                fetch('/api/seminars'),
                fetch('/api/testimonials'),
            ]);

            set({
                loading: false,
                outcomes: await outcomesResponse.json(),
                seminars: await seminarsResponse.json(),
                testimonials: await testimonialsResponse.json(),
            });
        } catch {
            set({ loading: false });
        }
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

    function showToast(message: string, error = false) {
        clearTimeout(toastTimer.current);
        set({ toast: message, toastError: error });
        toastTimer.current = setTimeout(() => set({ toast: null, toastError: false }), 3_000);
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
        if (state.form.cover.trim() && !/^https?:\/\/.+/.test(state.form.cover.trim())) errors.cover = true;
        if (!state.form.content.trim()) errors.content = true;
        if (Object.keys(errors).length) {
            set({ formErrors: errors });
            return;
        }

        const isNew = state.editing === 'new';
        const body: Record<string, string> = { ...state.form };

        if (!isNew && state.editing) body.id = state.editing;

        set({ saving: true });

        try {
            const response = await authFetch('/api/seminars', {
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (response.status === 409) {
                set({ saving: false });
                showToast('A seminar already exists on this date', true);
                return;
            }

            if (!response.ok) {
                set({ saving: false });
                showToast('Failed to save', true);
                return;
            }

            set({ editing: null, form: null, formErrors: {}, saving: false });
            fetchData();
            showToast(isNew ? 'Seminar created' : 'Changes saved');
        } catch {
            set({ saving: false });
            showToast('Failed to save', true);
        }
    }

    function handleStartEdit(id: string) {
        const seminar = state.seminars.find(item => item.id === id);
        if (seminar) {
            set({
                editing: seminar.date || id,
                form: { content: seminar.content, cover: seminar.cover || '', date: seminar.date, difficulty: seminar.difficulty || '', location: seminar.location, title: seminar.title },
                formErrors: {},
            });
        }
    }

    function handleStartNew() {
        set({ editing: 'new', form: { content: '', cover: '', date: '', difficulty: '', location: '', title: '' }, formErrors: {} });
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
        if (!state.outcomeForm.points.trim()) errors.points = true;
        if (Object.keys(errors).length) {
            set({ outcomeFormErrors: errors });
            return;
        }

        const isNew = state.editingOutcome === 'new';
        const points = state.outcomeForm.points.split('\n').map(line => line.trim()).filter(Boolean);
        const body: Record<string, string | string[]> = { points, summary: state.outcomeForm.summary, title: state.outcomeForm.title };

        if (!isNew && state.editingOutcome) body.id = state.editingOutcome;

        set({ saving: true });

        try {
            await authFetch('/api/outcomes', { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' });
            set({ editingOutcome: null, outcomeForm: null, outcomeFormErrors: {}, saving: false });
            fetchData();
            showToast(isNew ? 'Outcome created' : 'Changes saved');
        } catch {
            set({ saving: false });
            showToast('Failed to save', true);
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

    function handleCancelTestimonialEdit() {
        set({ editingTestimonial: null, testimonialForm: null, testimonialFormErrors: {} });
    }

    async function handleSaveTestimonial() {
        if (!state.testimonialForm) return;
        const errors: Record<string, boolean> = {};
        if (!state.testimonialForm.industry.trim()) errors.industry = true;
        if (!state.testimonialForm.name.trim()) errors.name = true;
        if (!state.testimonialForm.quote.trim()) errors.quote = true;
        if (!state.testimonialForm.role.trim()) errors.role = true;
        if (Object.keys(errors).length) {
            set({ testimonialFormErrors: errors });
            return;
        }

        const isNew = state.editingTestimonial === 'new';
        const body: Record<string, string> = { ...state.testimonialForm };

        if (!isNew && state.editingTestimonial) body.id = state.editingTestimonial;

        set({ saving: true });

        try {
            await authFetch('/api/testimonials', { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' });
            set({ editingTestimonial: null, saving: false, testimonialForm: null, testimonialFormErrors: {} });
            fetchData();
            showToast(isNew ? 'Testimonial created' : 'Changes saved');
        } catch {
            set({ saving: false });
            showToast('Failed to save', true);
        }
    }

    function handleStartNewTestimonial() {
        set({ editingTestimonial: 'new', testimonialForm: { industry: '', name: '', quote: '', role: '' }, testimonialFormErrors: {} });
    }

    function handleStartTestimonialEdit(id: string) {
        const testimonial = state.testimonials.find(item => item.id === id);
        if (testimonial) {
            set({ editingTestimonial: id, testimonialForm: { industry: testimonial.industry, name: testimonial.name, quote: testimonial.quote, role: testimonial.role }, testimonialFormErrors: {} });
        }
    }

    function handleUpdateTestimonialForm(fields: Partial<TestimonialFormData>) {
        update((previous) => {
            if (!previous.testimonialForm) return {};
            return {
                testimonialForm: { ...previous.testimonialForm, ...fields },
                testimonialFormErrors: { ...previous.testimonialFormErrors, ...Object.fromEntries(Object.keys(fields).map(key => [key, false])) },
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
        authFetch,
        fetchData,
        handleCancelEdit,
        handleCancelOutcomeEdit,
        handleCancelTestimonialEdit,
        handleResetForLogout,
        handleSaveForm,
        handleSaveOutcome,
        handleSaveTestimonial,
        handleStartEdit,
        handleStartNew,
        handleStartNewOutcome,
        handleStartNewTestimonial,
        handleStartOutcomeEdit,
        handleStartTestimonialEdit,
        handleToggleNav,
        handleUpdateForm,
        handleUpdateOutcomeForm,
        handleUpdateTestimonialForm,
        isMobile,
        set,
        showToast,
        state,
        update,
    };
}

function AdminForm({ editing, form, formErrors, isMobile, onCancel, onDelete, onSave, onUpdate, saving }: {
    editing: string;
    form: SeminarFormData;
    formErrors: Record<string, boolean>;
    isMobile: boolean;
    onCancel: () => void;
    onDelete: () => void;
    onSave: () => void;
    onUpdate: (fields: Partial<SeminarFormData>) => void;
    saving: boolean;
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
                        <select className="dashboard-input" value={form.difficulty} onChange={event => onUpdate({ difficulty: event.target.value })} style={{ ...STYLES.inputBase, background: '#ffffff', border: STYLES.borderMuted, padding: '11px 14px' }}>
                            <option value="">None</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </FormField>
                </div>
                <FormField errorMessage={formErrors.location ? 'Location is required.' : undefined} label="Location" required>
                    <input className="dashboard-input" value={form.location} onChange={event => onUpdate({ location: event.target.value })} placeholder="e.g. Shanghai" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('location')}` }} />
                </FormField>
                <FormField errorMessage={formErrors.cover ? 'Must be a valid URL.' : undefined} label="Cover">
                    <input className="dashboard-input" value={form.cover} onChange={event => onUpdate({ cover: event.target.value })} placeholder="https://…" style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('cover')}` }} />
                </FormField>
                <FormField errorMessage={formErrors.content ? 'Content is required.' : undefined} label="Content" labelSuffix="· Markdown" required>
                    <textarea className="dashboard-input" value={form.content} onChange={event => onUpdate({ content: event.target.value })} rows={9} placeholder={'Describe what the seminar covers and who it serves.\n\n## What you\'ll learn\n- First key takeaway or skill\n- Second key takeaway or skill\n- Third key takeaway or skill\n\n## Who it\'s for\nThe target audience and their typical challenges.'} style={{ ...STYLES.inputBase, border: `1px solid ${errorBorder('content')}`, fontFamily: FONT_MONO, fontSize: 13.5, lineHeight: 1.6, minHeight: 200, resize: 'vertical' as const }} />
                </FormField>
                <div style={{ borderTop: '1px solid #eceef2', display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                    <button className="dashboard-button--primary" disabled={saving} type="submit" style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                        {saving && <Spinner />}
                        {editing === 'new' ? 'Create seminar' : 'Save changes'}
                    </button>
                    <button className="dashboard-button--outline" disabled={saving} type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    {editing !== 'new' && (
                        <>
                            <div style={{ flex: 1 }} />
                            <button className="dashboard-button--danger" disabled={saving} type="button" onClick={onDelete}>
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
        ? { background: '#ffffff', borderRight: STYLES.border, bottom: 0, boxShadow: drawerOpen ? '0 16px 40px rgba(20,22,28,.18)' : 'none', display: 'flex', flexDirection: 'column', left: 0, position: 'fixed', top: 60, transform: drawerOpen ? 'translateX(0)' : 'translateX(-110%)', transition: 'transform 0.15s ease', width: 240, zIndex: 35 }
        : { alignSelf: 'flex-start', background: '#ffffff', borderRight: STYLES.border, display: 'flex', flex: 'none', flexDirection: 'column', height: 'calc(100vh - 60px)', marginLeft: drawerOpen ? 0 : -240, overflow: 'auto', position: 'sticky', top: 60, transition: 'margin-left 0.15s ease', width: 240 };

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
                        {['Beginner', 'Intermediate', 'Advanced'].map(difficulty => (
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

function LoginScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div style={{ alignItems: 'center', background: '#f7f8fa', display: 'flex', fontFamily: '\'Hanken Grotesk\', sans-serif', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(24px, 5vw, 48px)' }}>
            <div style={{ maxWidth: 420, width: '100%' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                    <span style={{ background: ACCENT, borderRadius: 12, display: 'inline-block', height: 44, width: 44 }} />
                    <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>InterSub</span>
                </div>
                <div style={{ background: '#ffffff', border: STYLES.border, borderRadius: 18, boxShadow: '0 1px 3px #14161c0a, 0 10px 40px #14161c0f', padding: 'clamp(28px, 5vw, 40px) clamp(24px, 4vw, 36px)' }}>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px', textAlign: 'center' }}>Sign in</h1>
                    <p style={{ color: STYLES.colorGhost, fontSize: 14, lineHeight: 1.5, margin: '0 0 28px', textAlign: 'center' }}>Admin access only.</p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            auth.handleLogin(email, password);
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
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
                        <button className="dashboard-button--primary" type="submit" style={{ fontSize: 15, marginTop: 8, padding: '14px 0' }}>Sign in</button>
                    </form>
                </div>
                <a className="dashboard-link" href="/" style={{ color: STYLES.colorGhost, display: 'block', fontSize: 13, marginTop: 24, textAlign: 'center' }}>&larr; Back to site</a>
            </div>
        </div>
    );
}

function SetPasswordScreen({ auth }: { auth: ReturnType<typeof useAuth> }) {
    const [password, setPassword] = useState('');

    return (
        <div style={{ alignItems: 'center', background: '#f7f8fa', display: 'flex', fontFamily: '\'Hanken Grotesk\', sans-serif', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(24px, 5vw, 48px)' }}>
            <div style={{ maxWidth: 420, width: '100%' }}>
                <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'clamp(32px, 5vw, 48px)' }}>
                    <span style={{ background: ACCENT, borderRadius: 12, display: 'inline-block', height: 44, width: 44 }} />
                    <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>InterSub</span>
                </div>
                <div style={{ background: '#ffffff', border: STYLES.border, borderRadius: 18, boxShadow: '0 1px 3px #14161c0a, 0 10px 40px #14161c0f', padding: 'clamp(28px, 5vw, 40px) clamp(24px, 4vw, 36px)' }}>
                    <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px', textAlign: 'center' }}>Set your password</h1>
                    <p style={{ color: STYLES.colorGhost, fontSize: 14, lineHeight: 1.5, margin: '0 0 28px', textAlign: 'center' }}>Choose a password for your admin account.</p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            auth.handleSetPassword(password);
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                    >
                        <div>
                            <label htmlFor="dashboard-new-password" style={STYLES.labelBase}>New password</label>
                            <input className="dashboard-input" id="dashboard-new-password" value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="At least 8 characters" style={{ ...STYLES.inputBase, border: STYLES.borderMuted }} />
                        </div>
                        {auth.error && <p style={{ color: STYLES.colorError, fontSize: 13, margin: 0 }}>{auth.error}</p>}
                        <button className="dashboard-button--primary" type="submit" style={{ fontSize: 15, marginTop: 8, padding: '14px 0' }}>Set password</button>
                    </form>
                </div>
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

function TableHeader({ onSort, sortDir, sortKey }: {
    onSort: (field: string) => void;
    sortDir: string;
    sortKey: string;
}) {
    function sortArrow(field: string) {
        return sortKey === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    }

    const headerStyle: React.CSSProperties = { alignItems: 'center', color: STYLES.colorGhost, display: 'flex', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, gap: 5, justifyContent: 'flex-start', letterSpacing: '.08em', padding: 0, textAlign: 'left', textTransform: 'uppercase' };

    return (
        <div style={{ alignItems: 'center', background: '#fafbfc', borderBottom: '1px solid #eceef2', display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 130px 130px', padding: 'clamp(10px, 2vw, 13px) clamp(14px, 2.5vw, 22px)' }}>
            <button className="dashboard-button--ghost" onClick={() => onSort('title')} style={headerStyle}>
                Title
                {sortArrow('title')}
            </button>
            <button className="dashboard-button--ghost" onClick={() => onSort('date')} style={headerStyle}>
                Date
                {sortArrow('date')}
            </button>
            <button className="dashboard-button--ghost" onClick={() => onSort('location')} style={headerStyle}>
                Location
                {sortArrow('location')}
            </button>
            <button className="dashboard-button--ghost" onClick={() => onSort('level')} style={headerStyle}>
                Level
                {sortArrow('level')}
            </button>
            <span style={{ ...headerStyle, justifyContent: 'flex-end', width: '100%' }}>Actions</span>
        </div>
    );
}

function OutcomesPanel({ editingOutcome, isMobile, onCancelEdit, onSave, onStartEdit, onStartNew, onUpdate, outcomeForm, outcomeFormErrors, outcomes, saving, set }: {
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
                    <div style={{ borderTop: '1px solid #eceef2', display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                        <button className="dashboard-button--primary" disabled={saving} type="submit" style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                            {saving && <Spinner />}
                            {editingOutcome === 'new' ? 'Create outcome' : 'Save changes'}
                        </button>
                        <button className="dashboard-button--outline" disabled={saving} type="button" onClick={onCancelEdit}>
                            Cancel
                        </button>
                        {editingOutcome !== 'new' && (
                            <>
                                <div style={{ flex: 1 }} />
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
                                <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Add an outcome to highlight measurable client results on the site.</p>
                            </div>
                        )}
            </div>
        </div>
    );
}

function TestimonialsPanel({ editingTestimonial, isMobile, onCancelEdit, onSave, onSort, onStartEdit, onStartNew, onUpdate, saving, set, sortDir, sortKey, testimonialForm, testimonialFormErrors, testimonials }: {
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
                    <div style={{ borderTop: '1px solid #eceef2', display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, paddingTop: 20 }}>
                        <button className="dashboard-button--primary" disabled={saving} type="submit" style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
                            {saving && <Spinner />}
                            {editingTestimonial === 'new' ? 'Create testimonial' : 'Save changes'}
                        </button>
                        <button className="dashboard-button--outline" disabled={saving} type="button" onClick={onCancelEdit}>
                            Cancel
                        </button>
                        {editingTestimonial !== 'new' && (
                            <>
                                <div style={{ flex: 1 }} />
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
                                                <button className="dashboard-button--outline" onClick={() => onStartEdit(testimonial.id)} style={actionStyle}>Edit</button>
                                                <button className="dashboard-button--danger" onClick={() => set({ confirmDelete: testimonial.id, confirmDeleteType: 'testimonial' })} style={actionStyle}>Delete</button>
                                            </div>
                                        </div>
                                    )
                                : (
                                        <div key={testimonial.id} style={{ alignItems: 'center', borderBottom: STYLES.colorRowBorder, display: 'grid', gap: 16, gridTemplateColumns: '1fr 120px 120px 1.5fr 130px', padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2.5vw, 22px)' }}>
                                            <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{testimonial.name}</p>
                                            <span style={{ color: STYLES.colorMuted, fontSize: 14 }}>{testimonial.role}</span>
                                            <span style={{ color: STYLES.colorMuted, fontSize: 14 }}>{testimonial.industry}</span>
                                            <p style={{ color: STYLES.colorGhost, fontSize: 13, fontStyle: 'italic', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                &ldquo;
                                                {testimonial.quote}
                                                &rdquo;
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

function DashboardInner() {
    const auth = useAuth();
    const {
        authFetch,
        fetchData,
        handleCancelEdit,
        handleCancelOutcomeEdit,
        handleCancelTestimonialEdit,
        handleResetForLogout,
        handleSaveForm,
        handleSaveOutcome,
        handleSaveTestimonial,
        handleStartEdit,
        handleStartNew,
        handleStartNewOutcome,
        handleStartNewTestimonial,
        handleStartOutcomeEdit,
        handleStartTestimonialEdit,
        handleToggleNav,
        handleUpdateForm,
        handleUpdateOutcomeForm,
        handleUpdateTestimonialForm,
        isMobile,
        set,
        showToast,
        state,
    } = useDashboardState(auth.getToken);

    if (auth.loading) {
        return (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', fontFamily: '\'Hanken Grotesk\', sans-serif', gap: 16, justifyContent: 'center', minHeight: '100vh' }}>
                <Spinner size={48} />
                <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Loading&hellip;</p>
            </div>
        );
    }

    if (!auth.user) {
        return <LoginScreen auth={auth} />;
    }

    if (auth.recovery) {
        return <SetPasswordScreen auth={auth} />;
    }

    if (state.loading) {
        return (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', fontFamily: '\'Hanken Grotesk\', sans-serif', gap: 16, justifyContent: 'center', minHeight: '100vh' }}>
                <Spinner size={48} />
                <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Loading&hellip;</p>
            </div>
        );
    }

    const query = state.adminSearch.trim().toLowerCase();
    const direction = state.sortDir === 'asc' ? 1 : -1;

    const filteredOutcomes = query
        ? state.outcomes.filter(outcome => outcome.title.toLowerCase().includes(query) || outcome.summary.toLowerCase().includes(query))
        : state.outcomes;

    const filteredTestimonials = (query
        ? state.testimonials.filter(testimonial => testimonial.name.toLowerCase().includes(query) || testimonial.industry.toLowerCase().includes(query) || testimonial.role.toLowerCase().includes(query))
        : state.testimonials
    ).slice().sort((a, b) => {
        const key = state.sortKey as keyof AdminTestimonial;
        const valueA = (key === 'industry' || key === 'name' || key === 'role') ? a[key].toLowerCase() : a.name.toLowerCase();
        const valueB = (key === 'industry' || key === 'name' || key === 'role') ? b[key].toLowerCase() : b.name.toLowerCase();

        return valueA < valueB ? -direction : valueA > valueB ? direction : 0;
    });

    const filteredRows = state.seminars
        .filter(seminar =>
            (state.adminFilters.length === 0 || state.adminFilters.includes(seminar.difficulty || ''))
            && (state.adminLocation === 'all' || seminar.location === state.adminLocation)
            && (!query || seminar.title.toLowerCase().includes(query) || seminar.location.toLowerCase().includes(query)),
        )
        .slice()
        .sort((a, b) => {
            let valueA: string, valueB: string;

            switch (state.sortKey) {
                case 'date':
                    valueA = a.date;
                    valueB = b.date;
                    break;
                case 'level':
                    valueA = a.difficulty || '';
                    valueB = b.difficulty || '';
                    break;
                case 'location':
                    valueA = a.location.toLowerCase();
                    valueB = b.location.toLowerCase();
                    break;
                default:
                    valueA = a.title.toLowerCase();
                    valueB = b.title.toLowerCase();
            }

            return valueA < valueB ? -direction : valueA > valueB ? direction : 0;
        });

    const confirmItem = state.confirmDelete
        ? (state.confirmDeleteType === 'outcome'
                ? state.outcomes.find(outcome => outcome.id === state.confirmDelete)
                : state.confirmDeleteType === 'testimonial'
                    ? state.testimonials.find(testimonial => testimonial.id === state.confirmDelete)
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
                    onSelectPanel={key => set({ activePanel: key as DashboardState['activePanel'], editing: null, editingOutcome: null, editingTestimonial: null, form: null, outcomeForm: null, testimonialForm: null })}
                />
                <main style={{ flex: 1, minWidth: 0, padding: 'clamp(20px, 4vw, 48px) clamp(16px, 3vw, 40px)' }}>
                    {state.activePanel === 'testimonials'
                        ? (
                                <TestimonialsPanel
                                    editingTestimonial={state.editingTestimonial}
                                    isMobile={isMobile}
                                    onCancelEdit={handleCancelTestimonialEdit}
                                    onSave={handleSaveTestimonial}
                                    onSort={handleToggleSort}
                                    onStartEdit={handleStartTestimonialEdit}
                                    onStartNew={handleStartNewTestimonial}
                                    onUpdate={handleUpdateTestimonialForm}
                                    saving={state.saving}
                                    set={set}
                                    sortDir={state.sortDir}
                                    sortKey={state.sortKey}
                                    testimonialForm={state.testimonialForm}
                                    testimonialFormErrors={state.testimonialFormErrors}
                                    testimonials={filteredTestimonials}
                                />
                            )
                        : state.activePanel === 'outcomes'
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
                                        saving={state.saving}
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
                                                        {state.seminars.filter(seminar => seminar.difficulty === 'Beginner').length}
                                                        {' '}
                                                        Beginner
                                                    </span>
                                                    <span aria-hidden="true">&middot;</span>
                                                    <span>
                                                        {state.seminars.filter(seminar => seminar.difficulty === 'Intermediate').length}
                                                        {' '}
                                                        Intermediate
                                                    </span>
                                                    <span aria-hidden="true">&middot;</span>
                                                    <span>
                                                        {state.seminars.filter(seminar => seminar.difficulty === 'Advanced').length}
                                                        {' '}
                                                        Advanced
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
                                                        onSort={handleToggleSort}
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
                                                                <p style={{ color: STYLES.colorGhost, fontSize: 14, margin: 0 }}>Try a different search or filter, or add a new seminar.</p>
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
                                                saving={state.saving}
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
                        const endpoints: Record<string, string> = { outcome: '/api/outcomes', seminar: '/api/seminars', testimonial: '/api/testimonials' };
                        const labels: Record<string, string> = { outcome: 'Outcome', seminar: 'Seminar', testimonial: 'Testimonial' };
                        const endpoint = endpoints[state.confirmDeleteType];
                        const label = labels[state.confirmDeleteType];
                        set({ confirmDelete: null, editing: null, editingOutcome: null, editingTestimonial: null, form: null, outcomeForm: null, testimonialForm: null });
                        try {
                            await authFetch(endpoint, { body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' }, method: 'DELETE' });
                            fetchData();
                            showToast(`${label} deleted`);
                        } catch {
                            showToast('Failed to delete', true);
                        }
                    }}
                    title={'title' in confirmItem ? confirmItem.title : confirmItem.name}
                />
            )}
            {state.toast && (
                <div aria-live="polite" role="status" style={{ alignItems: 'center', animation: 'dashboard__toast-in 0.4s ease both', background: state.toastError ? '#fdecea' : '#e7f4ef', border: `1px solid ${state.toastError ? '#c0392b' : '#0d7a5f'}`, borderRadius: 12, bottom: 36, boxShadow: '0 8px 24px rgba(20,22,28,.16)', color: state.toastError ? '#c0392b' : '#0d7a5f', display: 'flex', fontFamily: '\'Hanken Grotesk\', sans-serif', fontSize: 15, fontWeight: 600, gap: 10, left: '50%', maxWidth: 'calc(100vw - 48px)', padding: 'clamp(12px, 2vw, 14px) clamp(16px, 3vw, 24px)', position: 'fixed', transform: 'translateX(-50%)', whiteSpace: 'nowrap', zIndex: 50 }}>
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
