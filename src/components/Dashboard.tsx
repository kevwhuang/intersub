import { Fragment, useCallback, useEffect, useReducer, useRef, useState } from 'react';

import DeleteModal from '@components/DeleteModal';
import EditForm from '@components/dashboard/EditForm';
import ErrorBoundary from '@components/ErrorBoundary';
import EventRow from '@components/dashboard/EventRow';
import EventTableHeader from '@components/dashboard/EventTableHeader';
import FilterChips from '@components/dashboard/FilterChips';
import LoginScreen from '@components/dashboard/LoginScreen';
import OutcomesPanel from '@components/dashboard/OutcomesPanel';
import SetPasswordScreen from '@components/dashboard/SetPasswordScreen';
import Sidebar from '@components/dashboard/Sidebar';
import Spinner from '@components/Spinner';
import TestimonialsPanel from '@components/dashboard/TestimonialsPanel';
import TopBar from '@components/dashboard/TopBar';
import { FONT_HEADING, FONT_MONO, LEVELS, STYLES, URL_PATTERN } from '@lib/constants';
import { getToday } from '@lib/utils';
import { useAuth } from '@lib/authClient';

type DashboardAction
    = | { payload: (state: DashboardState) => Partial<DashboardState>; type: 'FN' }
        | { payload: Partial<DashboardState>; type: 'SET' };

interface DashboardState {
    activeLevel: string;
    activeLocation: string;
    activePanel: 'events' | 'outcomes' | 'testimonials';
    activeTiming: string;
    confirmDeleteId: string | null;
    confirmDeleteType: 'event' | 'outcome' | 'testimonial';
    editingEventId: string | null;
    editingOutcomeId: string | null;
    editingTestimonialId: string | null;
    eventForm: EventFormData | null;
    eventFormErrors: Record<string, boolean>;
    events: AdminEvent[];
    isDrawerOpen: boolean;
    isLoading: boolean;
    isSaving: boolean;
    isToastError: boolean;
    outcomeForm: OutcomeFormData | null;
    outcomeFormErrors: Record<string, boolean>;
    outcomes: AdminOutcome[];
    searchValue: string;
    sortDirection: 'asc' | 'desc';
    sortKey: string;
    testimonialForm: TestimonialFormData | null;
    testimonialFormErrors: Record<string, boolean>;
    testimonials: AdminTestimonial[];
    toast: string | null;
}

interface EventFormData {
    content: string;
    cover: string;
    date: string;
    level: string;
    location: string;
    title: string;
}

const EVENT_FORM_ROWS: EditFormField<EventFormData>[][] = [
    [{ errorMessage: 'Title is required.', key: 'title', kind: 'input', label: 'Title', placeholder: 'e.g. Executive Presence in English Meetings', required: true }],
    [
        { errorMessage: 'Date is required.', key: 'date', kind: 'date', label: 'Date', required: true },
        { key: 'level', kind: 'select', label: 'Who', options: LEVELS },
    ],
    [{ errorMessage: 'Location is required.', key: 'location', kind: 'input', label: 'Location', placeholder: 'e.g. Shanghai', required: true }],
    [{ errorMessage: 'Must be a valid URL.', key: 'cover', kind: 'input', label: 'Cover', placeholder: 'https://\u2026' }],
    [{ errorMessage: 'Content is required.', key: 'content', kind: 'textarea', label: 'Content', labelSuffix: '\u00B7 Markdown', minHeight: 200, mono: true, placeholder: 'Describe what the event covers and who it serves.\n\n## What you\u2019ll learn\n- First key takeaway or skill\n- Second key takeaway or skill\n- Third key takeaway or skill\n\n## Who it\u2019s for\nThe target audience and their typical challenges.', required: true, rows: 9 }],
];

const MOBILE_BREAKPOINT = 1_024;
const OFFLINE_ERROR = 'You appear to be offline. Please try again.';

const PANEL_META = {
    event: { endpoint: '/api/events', label: 'Event' },
    outcome: { endpoint: '/api/outcomes', label: 'Outcome' },
    testimonial: { endpoint: '/api/testimonials', label: 'Testimonial' },
} as const;

const TOAST_DURATION = 3_000;

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    if (action.type === 'SET') return { ...state, ...action.payload };
    if (action.type === 'FN') return { ...state, ...action.payload(state) };

    return state;
}

function getFailureMessage(fallback: string) {
    return navigator.onLine ? fallback : OFFLINE_ERROR;
}

function useDashboardState(getToken: () => Promise<string | null>, onSessionExpired: () => void) {
    const [state, dispatch] = useReducer(dashboardReducer, {
        activeLevel: 'all',
        activeLocation: 'all',
        activePanel: 'events',
        activeTiming: 'all',
        confirmDeleteId: null,
        confirmDeleteType: 'event',
        editingEventId: null,
        editingOutcomeId: null,
        editingTestimonialId: null,
        eventForm: null,
        eventFormErrors: {},
        events: [],
        isDrawerOpen: typeof window !== 'undefined' && window.innerWidth > MOBILE_BREAKPOINT,
        isLoading: true,
        isSaving: false,
        isToastError: false,
        outcomeForm: null,
        outcomeFormErrors: {},
        outcomes: [],
        searchValue: '',
        sortDirection: 'asc',
        sortKey: 'name',
        testimonialForm: null,
        testimonialFormErrors: {},
        testimonials: [],
        toast: null,
    } satisfies DashboardState);

    const [isMobile, setIsMobile] = useState(false);

    const set = useCallback(
        (payload: Partial<DashboardState>) => dispatch({ payload, type: 'SET' }),
        [],
    );

    const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const update = useCallback(
        (callback: (state: DashboardState) => Partial<DashboardState>) => dispatch({ payload: callback, type: 'FN' }),
        [],
    );

    async function fetchData() {
        try {
            const responses = await Promise.all([
                fetch(PANEL_META.event.endpoint),
                fetch(PANEL_META.outcome.endpoint),
                fetch(PANEL_META.testimonial.endpoint),
            ]);

            if (responses.some(response => !response.ok)) {
                set({ isLoading: false });
                showToast(getFailureMessage('Failed to load data'), true);

                return;
            }

            const [events, outcomes, testimonials] = await Promise.all(responses.map(response => response.json()));

            set({ events, isLoading: false, outcomes, testimonials });
        } catch {
            set({ isLoading: false });
            showToast(getFailureMessage('Failed to load data'), true);
        }
    }

    async function fetchWithAuth(url: string, options: RequestInit) {
        const token = await getToken();

        if (!token) {
            if (navigator.onLine) onSessionExpired();

            throw new Error('Session expired');
        }

        const headers = { ...options.headers as Record<string, string>, Authorization: `Bearer ${token}` };

        return fetch(url, { ...options, headers });
    }

    function handleCancelEventEdit() {
        set({ editingEventId: null, eventForm: null, eventFormErrors: {} });
    }

    function handleCancelOutcomeEdit() {
        set({ editingOutcomeId: null, outcomeForm: null, outcomeFormErrors: {} });
    }

    function handleCancelTestimonialEdit() {
        set({ editingTestimonialId: null, testimonialForm: null, testimonialFormErrors: {} });
    }

    function handleResetForLogout() {
        set({ isDrawerOpen: false, editingEventId: null });
    }

    async function handleSaveEvent() {
        if (!state.eventForm) return;

        const errors: Record<string, boolean> = {};

        if (!state.eventForm.title.trim()) errors.title = true;
        if (!state.eventForm.date) errors.date = true;
        if (!state.eventForm.location.trim()) errors.location = true;
        if (state.eventForm.cover.trim() && !URL_PATTERN.test(state.eventForm.cover.trim())) errors.cover = true;
        if (!state.eventForm.content.trim()) errors.content = true;

        if (Object.keys(errors).length) {
            set({ eventFormErrors: errors });

            return;
        }

        const isNew = state.editingEventId === 'new';
        const body: Record<string, string> = { ...state.eventForm };

        if (!isNew && state.editingEventId) body.id = state.editingEventId;

        set({ isSaving: true });

        try {
            const response = await fetchWithAuth(PANEL_META.event.endpoint, {
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!response.ok) {
                const { error } = await response.json().catch(() => ({}));

                set({ isSaving: false });
                showToast(error || 'Failed to save', true);

                return;
            }

            set({ editingEventId: null, eventForm: null, eventFormErrors: {}, isSaving: false });
            fetchData();
            showToast(isNew ? 'Event created' : 'Changes saved');
        } catch {
            set({ isSaving: false });
            showToast(getFailureMessage('Failed to save'), true);
        }
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

        const isNew = state.editingOutcomeId === 'new';
        const points = state.outcomeForm.points.split('\n').map(line => line.trim()).filter(Boolean);

        const body: Record<string, string | string[]> = { points, summary: state.outcomeForm.summary, title: state.outcomeForm.title };

        if (!isNew && state.editingOutcomeId) body.id = state.editingOutcomeId;

        set({ isSaving: true });

        try {
            const response = await fetchWithAuth(PANEL_META.outcome.endpoint, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' });

            if (!response.ok) {
                const { error } = await response.json().catch(() => ({}));

                set({ isSaving: false });
                showToast(error || 'Failed to save', true);

                return;
            }

            set({ editingOutcomeId: null, outcomeForm: null, outcomeFormErrors: {}, isSaving: false });
            fetchData();
            showToast(isNew ? 'Outcome created' : 'Changes saved');
        } catch {
            set({ isSaving: false });
            showToast(getFailureMessage('Failed to save'), true);
        }
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

        const isNew = state.editingTestimonialId === 'new';
        const body: Record<string, string> = { ...state.testimonialForm };

        if (!isNew && state.editingTestimonialId) body.id = state.editingTestimonialId;

        set({ isSaving: true });

        try {
            const response = await fetchWithAuth(PANEL_META.testimonial.endpoint, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' });

            if (!response.ok) {
                const { error } = await response.json().catch(() => ({}));

                set({ isSaving: false });
                showToast(error || 'Failed to save', true);

                return;
            }

            set({ editingTestimonialId: null, isSaving: false, testimonialForm: null, testimonialFormErrors: {} });
            fetchData();
            showToast(isNew ? 'Testimonial created' : 'Changes saved');
        } catch {
            set({ isSaving: false });
            showToast(getFailureMessage('Failed to save'), true);
        }
    }

    function handleStartEventEdit(id: string) {
        const entry = state.events.find(entry => entry.id === id);

        if (entry) {
            set({
                editingEventId: entry.date || id,
                eventForm: { content: entry.content, cover: entry.cover || '', date: entry.date, level: entry.level || '', location: entry.location, title: entry.title },
                eventFormErrors: {},
            });
        }
    }

    function handleStartNewEvent() {
        set({ editingEventId: 'new', eventForm: { content: '', cover: '', date: '', level: '', location: '', title: '' }, eventFormErrors: {} });
    }

    function handleStartNewOutcome() {
        set({ editingOutcomeId: 'new', outcomeForm: { points: '', summary: '', title: '' }, outcomeFormErrors: {} });
    }

    function handleStartNewTestimonial() {
        set({ editingTestimonialId: 'new', testimonialForm: { industry: '', name: '', quote: '', role: '' }, testimonialFormErrors: {} });
    }

    function handleStartOutcomeEdit(id: string) {
        const outcome = state.outcomes.find(outcome => outcome.id === id);

        if (outcome) set({ editingOutcomeId: id, outcomeForm: { points: outcome.points.join('\n'), summary: outcome.summary, title: outcome.title }, outcomeFormErrors: {} });
    }

    function handleStartTestimonialEdit(id: string) {
        const testimonial = state.testimonials.find(testimonial => testimonial.id === id);

        if (testimonial) set({ editingTestimonialId: id, testimonialForm: { industry: testimonial.industry, name: testimonial.name, quote: testimonial.quote, role: testimonial.role }, testimonialFormErrors: {} });
    }

    function handleToggleDrawer() {
        set({ isDrawerOpen: !state.isDrawerOpen });
    }

    function handleUpdateEventForm(fields: Partial<EventFormData>) {
        update((previous) => {
            if (!previous.eventForm) return {};

            return {
                eventForm: { ...previous.eventForm, ...fields },
                eventFormErrors: { ...previous.eventFormErrors, ...Object.fromEntries(Object.keys(fields).map(key => [key, false])) },
            };
        });
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

    function handleUpdateTestimonialForm(fields: Partial<TestimonialFormData>) {
        update((previous) => {
            if (!previous.testimonialForm) return {};

            return {
                testimonialForm: { ...previous.testimonialForm, ...fields },
                testimonialFormErrors: { ...previous.testimonialFormErrors, ...Object.fromEntries(Object.keys(fields).map(key => [key, false])) },
            };
        });
    }

    function showToast(message: string, isError = false) {
        clearTimeout(toastTimer.current);
        set({ isToastError: isError, toast: message });
        toastTimer.current = setTimeout(() => set({ isToastError: false, toast: null }), TOAST_DURATION);
    }

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

        setIsMobile(mediaQuery.matches);

        function handleChange(event: MediaQueryListEvent) {
            setIsMobile(event.matches);
        }

        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        function handleDrawerEscape(event: KeyboardEvent) {
            if (event.key === 'Escape' && isMobile) set({ isDrawerOpen: false });
        }

        document.addEventListener('keydown', handleDrawerEscape);

        return () => document.removeEventListener('keydown', handleDrawerEscape);
    }, [isMobile, set]);

    useEffect(() => {
        return () => {
            clearTimeout(toastTimer.current);
        };
    }, []);

    return {
        fetchData,
        fetchWithAuth,
        handleCancelEventEdit,
        handleCancelOutcomeEdit,
        handleCancelTestimonialEdit,
        handleResetForLogout,
        handleSaveEvent,
        handleSaveOutcome,
        handleSaveTestimonial,
        handleStartEventEdit,
        handleStartNewEvent,
        handleStartNewOutcome,
        handleStartNewTestimonial,
        handleStartOutcomeEdit,
        handleStartTestimonialEdit,
        handleToggleDrawer,
        handleUpdateEventForm,
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
        fetchData,
        fetchWithAuth,
        handleCancelEventEdit,
        handleCancelOutcomeEdit,
        handleCancelTestimonialEdit,
        handleResetForLogout,
        handleSaveEvent,
        handleSaveOutcome,
        handleSaveTestimonial,
        handleStartEventEdit,
        handleStartNewEvent,
        handleStartNewOutcome,
        handleStartNewTestimonial,
        handleStartOutcomeEdit,
        handleStartTestimonialEdit,
        handleToggleDrawer,
        handleUpdateEventForm,
        handleUpdateOutcomeForm,
        handleUpdateTestimonialForm,
        isMobile,
        set,
        showToast,
        state,
    } = useDashboardState(auth.getToken, auth.handleLogout);

    if (auth.isLoading) {
        return (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', minHeight: '100vh' }}>
                <Spinner size={48} />
                <p style={{ color: STYLES.colorGhost, fontSize: 16, margin: 0 }}>Loading&hellip;</p>
            </div>
        );
    }

    if (auth.isRecovery) return <SetPasswordScreen auth={auth} />;

    if (!auth.user) return <LoginScreen auth={auth} />;

    async function handleConfirmDelete() {
        const id = state.confirmDeleteId;

        const { endpoint, label } = PANEL_META[state.confirmDeleteType];

        set({ confirmDeleteId: null });

        try {
            const response = await fetchWithAuth(endpoint, { body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' }, method: 'DELETE' });

            if (!response.ok) {
                const { error } = await response.json().catch(() => ({}));

                showToast(error || 'Failed to delete', true);

                return;
            }

            set({ editingEventId: null, editingOutcomeId: null, editingTestimonialId: null, eventForm: null, outcomeForm: null, testimonialForm: null });
            fetchData();
            showToast(`${label} deleted`);
        } catch {
            showToast(getFailureMessage('Failed to delete'), true);
        }
    }

    function handleSignOut() {
        auth.handleLogout();
        handleResetForLogout();
    }

    if (state.isLoading) {
        return (
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', minHeight: '100vh' }}>
                <Spinner size={48} />
                <p style={{ color: STYLES.colorGhost, fontSize: 16, margin: 0 }}>Loading&hellip;</p>
            </div>
        );
    }

    const direction = state.sortDirection === 'asc' ? 1 : -1;
    const query = state.searchValue.trim().toLowerCase();
    const today = getToday();

    const confirmCollections = { event: state.events, outcome: state.outcomes, testimonial: state.testimonials };

    const confirmItem = state.confirmDeleteId
        ? confirmCollections[state.confirmDeleteType].find(entry => entry.id === state.confirmDeleteId)
        : null;

    const filteredEvents = state.events
        .filter(entry =>
            (state.activeLevel === 'all' || entry.level === state.activeLevel)
            && (state.activeLocation === 'all' || entry.location === state.activeLocation)
            && (state.activeTiming === 'all' || (state.activeTiming === 'upcoming' && entry.date >= today) || (state.activeTiming === 'past' && entry.date < today))
            && (!query || entry.location.toLowerCase().includes(query) || entry.title.toLowerCase().includes(query)),
        )
        .slice()
        .sort((entryA, entryB) => {
            let valueA: string, valueB: string;

            switch (state.sortKey) {
                case 'date':
                    valueA = entryA.date;
                    valueB = entryB.date;
                    break;
                case 'level':
                    valueA = entryA.level || '';
                    valueB = entryB.level || '';
                    break;
                case 'location':
                    valueA = entryA.location.toLowerCase();
                    valueB = entryB.location.toLowerCase();
                    break;
                default:
                    valueA = entryA.title.toLowerCase();
                    valueB = entryB.title.toLowerCase();
            }

            if (valueA < valueB) return -direction;
            if (valueA > valueB) return direction;

            return 0;
        });

    const filteredOutcomes = query
        ? state.outcomes.filter(outcome => outcome.summary.toLowerCase().includes(query) || outcome.title.toLowerCase().includes(query))
        : state.outcomes;

    const filteredTestimonials = (query
        ? state.testimonials.filter(testimonial => testimonial.industry.toLowerCase().includes(query) || testimonial.name.toLowerCase().includes(query) || testimonial.role.toLowerCase().includes(query))
        : state.testimonials
    ).slice().sort((testimonialA, testimonialB) => {
        const key = state.sortKey as keyof AdminTestimonial;

        const valueA = (key === 'industry' || key === 'name' || key === 'role') ? testimonialA[key].toLowerCase() : testimonialA.name.toLowerCase();
        const valueB = (key === 'industry' || key === 'name' || key === 'role') ? testimonialB[key].toLowerCase() : testimonialB.name.toLowerCase();

        if (valueA < valueB) return -direction;
        if (valueA > valueB) return direction;

        return 0;
    });

    function handleToggleSort(field: string) {
        set({ sortDirection: state.sortKey === field && state.sortDirection === 'asc' ? 'desc' : 'asc', sortKey: field });
    }

    function renderPanel() {
        if (state.activePanel === 'testimonials') {
            return (
                <TestimonialsPanel
                    editingTestimonialId={state.editingTestimonialId}
                    isMobile={isMobile}
                    onCancelEdit={handleCancelTestimonialEdit}
                    onRequestDelete={id => set({ confirmDeleteId: id, confirmDeleteType: 'testimonial' })}
                    onSave={handleSaveTestimonial}
                    onSort={handleToggleSort}
                    onStartEdit={handleStartTestimonialEdit}
                    onStartNew={handleStartNewTestimonial}
                    onUpdate={handleUpdateTestimonialForm}
                    isSaving={state.isSaving}
                    sortDirection={state.sortDirection}
                    sortKey={state.sortKey}
                    testimonialForm={state.testimonialForm}
                    testimonialFormErrors={state.testimonialFormErrors}
                    testimonials={filteredTestimonials}
                />
            );
        }

        if (state.activePanel === 'outcomes') {
            return (
                <OutcomesPanel
                    editingOutcomeId={state.editingOutcomeId}
                    isMobile={isMobile}
                    onCancelEdit={handleCancelOutcomeEdit}
                    onRequestDelete={id => set({ confirmDeleteId: id, confirmDeleteType: 'outcome' })}
                    onSave={handleSaveOutcome}
                    onStartEdit={handleStartOutcomeEdit}
                    onStartNew={handleStartNewOutcome}
                    onUpdate={handleUpdateOutcomeForm}
                    outcomeForm={state.outcomeForm}
                    outcomeFormErrors={state.outcomeFormErrors}
                    outcomes={filteredOutcomes}
                    isSaving={state.isSaving}
                />
            );
        }

        if (state.editingEventId === null) {
            const locations = [...new Set(state.events.map(entry => entry.location))].sort();

            return (
                <div style={{ margin: '0 auto', maxWidth: 1280 }}>
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Events</h1>
                        <div style={{ color: STYLES.colorGhost, display: 'flex', flexWrap: 'wrap', fontFamily: FONT_MONO, fontSize: 12, gap: '4px 8px', letterSpacing: '.06em', textTransform: 'lowercase' }}>
                            <span>
                                {state.events.length}
                                {' '}
                                {state.events.length === 1 ? 'event' : 'events'}
                            </span>
                            <span aria-hidden="true">&middot;</span>
                            <span>
                                {locations.length}
                                {' '}
                                {locations.length === 1 ? 'location' : 'locations'}
                            </span>
                            {LEVELS.map((level) => {
                                const count = state.events.filter(entry => entry.level === level).length;

                                if (!count) return null;

                                return (
                                    <Fragment key={level}>
                                        <span aria-hidden="true">&middot;</span>
                                        <span>
                                            {count}
                                            {' '}
                                            {level}
                                        </span>
                                    </Fragment>
                                );
                            })}
                        </div>
                    </div>
                    <FilterChips
                        activeLevel={state.activeLevel}
                        activeLocation={state.activeLocation}
                        activeTiming={state.activeTiming}
                        locations={locations}
                        onLevelChange={value => set({ activeLevel: value })}
                        onLocationChange={value => set({ activeLocation: value })}
                        onNewEvent={handleStartNewEvent}
                        onTimingChange={value => set({ activeTiming: value })}
                    />
                    <div aria-label={isMobile ? undefined : 'Events'} role={isMobile ? undefined : 'table'} style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 14, overflow: 'auto' }}>
                        {!isMobile && (
                            <EventTableHeader
                                onSort={handleToggleSort}
                                sortDirection={state.sortDirection}
                                sortKey={state.sortKey}
                            />
                        )}
                        {filteredEvents.length > 0
                            ? filteredEvents.map(entry => (
                                    <EventRow
                                        entry={entry}
                                        isMobile={isMobile}
                                        key={entry.id}
                                        onDelete={() => set({ confirmDeleteId: entry.id, confirmDeleteType: 'event' })}
                                        onEdit={() => handleStartEventEdit(entry.id)}
                                    />
                                ))
                            : (
                                    <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                                        <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>No events found</p>
                                        <p style={{ color: STYLES.colorGhost, fontSize: 16, margin: 0 }}>Try a different search or filter, or add a new event.</p>
                                    </div>
                                )}
                    </div>
                </div>
            );
        }

        if (state.eventForm) {
            return (
                <EditForm
                    editingId={state.editingEventId}
                    entity="event"
                    fieldRows={EVENT_FORM_ROWS}
                    form={state.eventForm}
                    formErrors={state.eventFormErrors}
                    isMobile={isMobile}
                    isSaving={state.isSaving}
                    onCancel={handleCancelEventEdit}
                    onDelete={() => set({ confirmDeleteId: state.editingEventId, confirmDeleteType: 'event' })}
                    onSave={handleSaveEvent}
                    onUpdate={handleUpdateEventForm}
                />
            );
        }

        return null;
    }

    return (
        <div style={{ background: STYLES.colorSurfaceRaised, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <TopBar
                isDrawerOpen={state.isDrawerOpen}
                onSearchChange={value => set({ searchValue: value })}
                onToggleDrawer={handleToggleDrawer}
                searchValue={state.searchValue}
            />
            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                {isMobile && state.isDrawerOpen && <button aria-label="Close navigation" onClick={() => set({ isDrawerOpen: false })} type="button" style={{ background: STYLES.overlayLight, border: 'none', inset: '60px 0 0 0', position: 'fixed', zIndex: 30 }} />}
                <Sidebar
                    activePanel={state.activePanel}
                    isDrawerOpen={state.isDrawerOpen}
                    isMobile={isMobile}
                    onCloseDrawer={() => set({ isDrawerOpen: false })}
                    onLogout={handleSignOut}
                    onSelectPanel={key => set({ activePanel: key as DashboardState['activePanel'], editingEventId: null, editingOutcomeId: null, editingTestimonialId: null, eventForm: null, outcomeForm: null, testimonialForm: null })}
                    userEmail={auth.user?.email ?? ''}
                />
                <main style={{ flex: 1, minWidth: 0, padding: 'clamp(20px, 4vw, 48px) clamp(16px, 3vw, 40px)' }}>
                    {renderPanel()}
                </main>
            </div>
            {state.confirmDeleteId && confirmItem && (
                <DeleteModal
                    onCancel={() => set({ confirmDeleteId: null })}
                    onConfirm={handleConfirmDelete}
                    title={'title' in confirmItem ? confirmItem.title : confirmItem.name}
                />
            )}
            {state.toast && (
                <div aria-live="polite" role="status" style={{ alignItems: 'center', animation: 'dashboard__toast-in 0.4s ease both', background: state.isToastError ? STYLES.colorErrorBackground : STYLES.colorSuccessBackground, border: `1px solid ${state.isToastError ? STYLES.colorError : STYLES.colorSuccess}`, borderRadius: 12, bottom: 36, boxShadow: STYLES.shadowToast, color: state.isToastError ? STYLES.colorError : STYLES.colorSuccess, display: 'flex', fontSize: 16, fontWeight: 600, gap: 10, left: '50%', maxWidth: 'calc(100vw - 48px)', padding: '12px clamp(16px, 3vw, 24px)', position: 'fixed', transform: 'translateX(-50%)', zIndex: 50 }}>
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
