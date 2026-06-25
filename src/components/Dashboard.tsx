import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import DeleteModal from '@components/DeleteModal';
import ErrorBoundary from '@components/ErrorBoundary';
import Spinner from '@components/Spinner';
import AdminForm from '@components/dashboard/AdminForm';
import AdminSidebar from '@components/dashboard/AdminSidebar';
import AdminTopBar from '@components/dashboard/AdminTopBar';
import FilterChips from '@components/dashboard/FilterChips';
import LoginScreen from '@components/dashboard/LoginScreen';
import OutcomesPanel from '@components/dashboard/OutcomesPanel';
import SeminarRow from '@components/dashboard/SeminarRow';
import SetPasswordScreen from '@components/dashboard/SetPasswordScreen';
import TableHeader from '@components/dashboard/TableHeader';
import TestimonialsPanel from '@components/dashboard/TestimonialsPanel';
import { FONT_HEADING, FONT_MONO, STYLES } from '@lib/constants';
import { useAuth } from '@lib/authClient';

type DashboardAction
    = | { payload: Partial<DashboardState>; type: 'SET' }
        | { payload: (state: DashboardState) => Partial<DashboardState>; type: 'FN' };

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
                    userEmail={auth.user?.email ?? ''}
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
