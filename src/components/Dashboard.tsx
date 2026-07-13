import { Fragment, useCallback, useEffect, useReducer, useRef, useState } from 'react';

import EditForm from '@components/dashboard/EditForm';
import ErrorBoundary from '@components/ErrorBoundary';
import EventRow from '@components/dashboard/EventRow';
import EventTableHeader from '@components/dashboard/EventTableHeader';
import FilterChips from '@components/dashboard/FilterChips';
import ModalDelete from '@components/ModalDelete';
import PanelOutcomes from '@components/dashboard/PanelOutcomes';
import PanelTestimonials from '@components/dashboard/PanelTestimonials';
import ScreenLogin from '@components/dashboard/ScreenLogin';
import ScreenSetPassword from '@components/dashboard/ScreenSetPassword';
import Sidebar from '@components/dashboard/Sidebar';
import Spinner from '@components/Spinner';
import TableEmpty from '@components/dashboard/TableEmpty';
import TopBar from '@components/dashboard/TopBar';
import { COVER_PATH_PATTERN, FONT_HEADING, FONT_MONO, LEVELS, STYLES, TIME_PATTERN, TOPBAR_HEIGHT, URL_PATTERN } from '@lib/constants';
import { getToday } from '@lib/utils';
import { useAuth } from '@lib/authClient';

type DashboardAction
    = { payload: (state: DashboardState) => Partial<DashboardState>; type: 'FN' }
        | { payload: Partial<DashboardState>; type: 'SET' };

interface DashboardState {
    activeLevel: string;
    activeLocation: string;
    activePanel: PanelKey;
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
    sortDirection: SortDirection;
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
    time: string;
    title: string;
}

const DELETE_ERROR = 'Failed to delete';

const EVENT_FORM_ROWS: EditFormField<EventFormData>[][] = [
    [{ errorMessage: 'Title is required.', key: 'title', kind: 'input', label: 'Title', required: true }],
    [
        { errorMessage: 'Date is required.', key: 'date', kind: 'date', label: 'Date', required: true },
        { errorMessage: 'Time must be a 24-hour range.', key: 'time', kind: 'input', label: 'Time', required: true },
    ],
    [
        { errorMessage: 'Location is required.', key: 'location', kind: 'input', label: 'Location', required: true },
        { key: 'level', kind: 'select', label: 'Who', options: LEVELS },
    ],
    [{ errorMessage: 'Cover must be a URL or internal image path.', key: 'cover', kind: 'input', label: 'Cover' }],
    [{ errorMessage: 'Content is required.', key: 'content', kind: 'textarea', label: 'Content', labelSuffix: '\u00B7 Markdown', minHeight: 200, mono: true, required: true, rows: 9 }],
];

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const LOAD_ERROR = 'Failed to load data';
const MOBILE_BREAKPOINT = 1_024;
const OFFLINE_ERROR = 'You appear to be offline. Please try again.';
const PANEL_KEY = 'intersub_panel';

const PANEL_META = {
    event: { endpoint: '/api/events', label: 'Event' },
    outcome: { endpoint: '/api/outcomes', label: 'Outcome' },
    testimonial: { endpoint: '/api/testimonials', label: 'Testimonial' },
} as const;

const SAVE_ERROR = 'Failed to save';
const TOAST_DURATION = 3_000;

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    if (action.type === 'SET') return { ...state, ...action.payload };
    if (action.type === 'FN') return { ...state, ...action.payload(state) };

    return state;
}

function getFailureMessage(fallback: string) {
    return navigator.onLine ? fallback : OFFLINE_ERROR;
}

function getInitialPanel(): PanelKey {
    if (typeof window === 'undefined') return 'events';

    const stored = localStorage.getItem(PANEL_KEY);

    return stored === 'outcomes' || stored === 'testimonials' ? stored : 'events';
}

function useDashboardState(getToken: () => Promise<string | null>, onSessionExpired: () => void) {
    const initialPanel = getInitialPanel();

    const [isMobile, setIsMobile] = useState(false);

    const [state, dispatch] = useReducer(dashboardReducer, {
        activeLevel: 'all',
        activeLocation: 'all',
        activePanel: initialPanel,
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
        sortKey: initialPanel === 'events' ? 'title' : 'name',
        testimonialForm: null,
        testimonialFormErrors: {},
        testimonials: [],
        toast: null,
    } satisfies DashboardState);

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
                showToast(getFailureMessage(LOAD_ERROR), true);

                return;
            }

            const [events, outcomes, testimonials] = await Promise.all(responses.map(response => response.json()));

            set({ events, isLoading: false, outcomes, testimonials });
        } catch {
            set({ isLoading: false });
            showToast(getFailureMessage(LOAD_ERROR), true);
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

    function handleDrawerEscape(event: KeyboardEvent) {
        if (event.key === 'Escape' && isMobile && state.isDrawerOpen) set({ isDrawerOpen: false });
    }

    async function handleSaveEvent() {
        if (!state.eventForm) return;

        const errors: Record<string, boolean> = {};

        if (!state.eventForm.title.trim()) errors.title = true;
        if (!state.eventForm.date) errors.date = true;
        if (!state.eventForm.location.trim()) errors.location = true;
        if (!TIME_PATTERN.test(state.eventForm.time.trim())) errors.time = true;

        if (state.eventForm.cover.trim() && !COVER_PATH_PATTERN.test(state.eventForm.cover.trim()) && !URL_PATTERN.test(state.eventForm.cover.trim())) {
            errors.cover = true;
        }

        if (!state.eventForm.content.trim()) errors.content = true;

        if (Object.keys(errors).length) {
            set({ eventFormErrors: errors });

            return;
        }

        const body: Record<string, string> = { ...state.eventForm };
        const isNew = state.editingEventId === 'new';

        if (!isNew && state.editingEventId) body.id = state.editingEventId;

        await submitEntity(PANEL_META.event.endpoint, body, { editingEventId: null, eventForm: null, eventFormErrors: {} }, isNew ? 'Event created' : 'Changes saved');
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

        await submitEntity(PANEL_META.outcome.endpoint, body, { editingOutcomeId: null, outcomeForm: null, outcomeFormErrors: {} }, isNew ? 'Outcome created' : 'Changes saved');
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

        const body: Record<string, string> = { ...state.testimonialForm };
        const isNew = state.editingTestimonialId === 'new';

        if (!isNew && state.editingTestimonialId) body.id = state.editingTestimonialId;

        await submitEntity(PANEL_META.testimonial.endpoint, body, { editingTestimonialId: null, testimonialForm: null, testimonialFormErrors: {} }, isNew ? 'Testimonial created' : 'Changes saved');
    }

    function handleStartEventEdit(id: string) {
        const entry = state.events.find(entry => entry.id === id);

        if (entry) {
            set({
                editingEventId: entry.date || id,
                eventForm: { content: entry.content, cover: entry.cover || '', date: entry.date, level: entry.level || '', location: entry.location, time: entry.time || '', title: entry.title },
                eventFormErrors: {},
            });
        }
    }

    function handleStartNewEvent() {
        set({ editingEventId: 'new', eventForm: { content: '', cover: '', date: '', level: '', location: '', time: '', title: '' }, eventFormErrors: {} });
    }

    function handleStartNewOutcome() {
        set({ editingOutcomeId: 'new', outcomeForm: { points: '', summary: '', title: '' }, outcomeFormErrors: {} });
    }

    function handleStartNewTestimonial() {
        set({ editingTestimonialId: 'new', testimonialForm: { industry: '', name: '', quote: '', role: '' }, testimonialFormErrors: {} });
    }

    function handleStartOutcomeEdit(id: string) {
        const outcome = state.outcomes.find(outcome => outcome.id === id);

        if (outcome) {
            set({ editingOutcomeId: id, outcomeForm: { points: outcome.points.join('\n'), summary: outcome.summary, title: outcome.title }, outcomeFormErrors: {} });
        }
    }

    function handleStartTestimonialEdit(id: string) {
        const testimonial = state.testimonials.find(testimonial => testimonial.id === id);

        if (testimonial) {
            set({ editingTestimonialId: id, testimonialForm: { industry: testimonial.industry, name: testimonial.name, quote: testimonial.quote, role: testimonial.role }, testimonialFormErrors: {} });
        }
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

    function handleViewportChange(event: MediaQueryListEvent) {
        setIsMobile(event.matches);
        set({ isDrawerOpen: !event.matches });
    }

    function showToast(message: string, isError = false) {
        clearTimeout(toastTimer.current);
        set({ isToastError: isError, toast: message });
        toastTimer.current = setTimeout(() => set({ isToastError: false, toast: null }), TOAST_DURATION);
    }

    async function submitEntity(endpoint: string, body: Record<string, unknown>, successState: Partial<DashboardState>, successMessage: string) {
        set({ isSaving: true });

        try {
            const response = await fetchWithAuth(endpoint, { body: JSON.stringify(body), headers: JSON_HEADERS, method: 'POST' });

            if (!response.ok) {
                const { error } = await response.json().catch(() => ({}));

                set({ isSaving: false });
                showToast(error || SAVE_ERROR, true);

                return;
            }

            set({ ...successState, isSaving: false });
            fetchData();
            showToast(successMessage);
        } catch {
            set({ isSaving: false });
            showToast(getFailureMessage(SAVE_ERROR), true);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

        setIsMobile(mediaQuery.matches);

        mediaQuery.addEventListener('change', handleViewportChange);

        return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }, [set]);

    useEffect(() => {
        document.addEventListener('keydown', handleDrawerEscape);

        return () => document.removeEventListener('keydown', handleDrawerEscape);
    }, [isMobile, set, state.isDrawerOpen]);

    useEffect(() => {
        return () => {
            clearTimeout(toastTimer.current);
        };
    }, []);

    useEffect(() => {
        if (state.activeLocation === 'all') return;

        if (!state.events.some(entry => entry.location === state.activeLocation)) set({ activeLocation: 'all' });
    }, [set, state.activeLocation, state.events]);

    return {
        fetchData,
        fetchWithAuth,
        handleCancelEventEdit,
        handleCancelOutcomeEdit,
        handleCancelTestimonialEdit,
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
    } = useDashboardState(auth.getToken, auth.handleSessionExpired);

    const confirmCollections = { event: state.events, outcome: state.outcomes, testimonial: state.testimonials };
    const direction = state.sortDirection === 'asc' ? 1 : -1;
    const query = state.searchValue.trim().toLowerCase();
    const today = getToday();

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
                    valueA = entryA.date + (entryA.time || '');
                    valueB = entryB.date + (entryB.time || '');
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
        const key = state.sortKey;

        const valueA = (key === 'industry' || key === 'name' || key === 'role') ? testimonialA[key].toLowerCase() : testimonialA.name.toLowerCase();
        const valueB = (key === 'industry' || key === 'name' || key === 'role') ? testimonialB[key].toLowerCase() : testimonialB.name.toLowerCase();

        if (valueA < valueB) return -direction;
        if (valueA > valueB) return direction;

        return 0;
    });

    async function handleConfirmDelete() {
        const id = state.confirmDeleteId;

        const { endpoint, label } = PANEL_META[state.confirmDeleteType];

        set({ confirmDeleteId: null });

        try {
            const response = await fetchWithAuth(endpoint, { body: JSON.stringify({ id }), headers: JSON_HEADERS, method: 'DELETE' });

            if (!response.ok) {
                const { error } = await response.json().catch(() => ({}));

                showToast(error || DELETE_ERROR, true);

                return;
            }

            set({ editingEventId: null, editingOutcomeId: null, editingTestimonialId: null, eventForm: null, outcomeForm: null, testimonialForm: null });
            fetchData();
            showToast(`${label} deleted`);
        } catch {
            showToast(getFailureMessage(DELETE_ERROR), true);
        }
    }

    function handleSelectPanel(key: PanelKey) {
        localStorage.setItem(PANEL_KEY, key);
        set({ activePanel: key, editingEventId: null, editingOutcomeId: null, editingTestimonialId: null, eventForm: null, outcomeForm: null, sortDirection: 'asc', sortKey: key === 'events' ? 'title' : 'name', testimonialForm: null });
    }

    function handleSignOut() {
        auth.handleLogout();
        set({ editingEventId: null, editingOutcomeId: null, editingTestimonialId: null, eventForm: null, isDrawerOpen: false, outcomeForm: null, testimonialForm: null });
    }

    function handleToggleSort(field: string) {
        set({ sortDirection: state.sortKey === field && state.sortDirection === 'asc' ? 'desc' : 'asc', sortKey: field });
    }

    function renderPanel() {
        if (state.activePanel === 'testimonials') {
            return (
                <PanelTestimonials
                    editingTestimonialId={state.editingTestimonialId}
                    isMobile={isMobile}
                    isSaving={state.isSaving}
                    onCancelEdit={handleCancelTestimonialEdit}
                    onRequestDelete={id => set({ confirmDeleteId: id, confirmDeleteType: 'testimonial' })}
                    onSave={handleSaveTestimonial}
                    onSort={handleToggleSort}
                    onStartEdit={handleStartTestimonialEdit}
                    onStartNew={handleStartNewTestimonial}
                    onUpdate={handleUpdateTestimonialForm}
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
                <PanelOutcomes
                    editingOutcomeId={state.editingOutcomeId}
                    isMobile={isMobile}
                    isSaving={state.isSaving}
                    onCancelEdit={handleCancelOutcomeEdit}
                    onRequestDelete={id => set({ confirmDeleteId: id, confirmDeleteType: 'outcome' })}
                    onSave={handleSaveOutcome}
                    onStartEdit={handleStartOutcomeEdit}
                    onStartNew={handleStartNewOutcome}
                    onUpdate={handleUpdateOutcomeForm}
                    outcomeForm={state.outcomeForm}
                    outcomeFormErrors={state.outcomeFormErrors}
                    outcomes={filteredOutcomes}
                />
            );
        }

        if (state.editingEventId === null) {
            const locations = [...new Set(state.events.map(entry => entry.location))].sort();

            return (
                <div style={{ margin: '0 auto', maxWidth: 1280 }}>
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, calc(21.33px + 0.83vw), 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>Events</h1>
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
                    <div aria-label={isMobile || !filteredEvents.length ? undefined : 'Events'} role={isMobile || !filteredEvents.length ? undefined : 'table'} style={{ background: STYLES.colorSurface, border: STYLES.border, borderRadius: 14, overflow: 'auto' }} tabIndex={0}>
                        {!isMobile && filteredEvents.length > 0 && (
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
                            : <TableEmpty description="Try a different search or filter, or add a new event." title="No events found" />}
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

    if (auth.isLoading) return <ScreenLoading />;

    if (auth.isRecovery) return <ScreenSetPassword auth={auth} />;

    if (!auth.user) return <ScreenLogin auth={auth} />;

    if (state.isLoading) return <ScreenLoading />;

    return (
        <div style={{ background: STYLES.colorSurfaceRaised, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <TopBar
                isDrawerOpen={state.isDrawerOpen}
                onSearchChange={value => set({ searchValue: value })}
                onToggleDrawer={handleToggleDrawer}
                searchValue={state.searchValue}
            />
            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                {isMobile && state.isDrawerOpen && <button aria-label="Close navigation" onClick={() => set({ isDrawerOpen: false })} style={{ background: STYLES.overlayLight, border: 'none', inset: `${TOPBAR_HEIGHT}px 0 0 0`, position: 'fixed', zIndex: 30 }} type="button" />}
                <Sidebar
                    activePanel={state.activePanel}
                    isDrawerOpen={state.isDrawerOpen}
                    isMobile={isMobile}
                    key={isMobile ? 'mobile' : 'desktop'}
                    onCloseDrawer={() => set({ isDrawerOpen: false })}
                    onLogout={handleSignOut}
                    onSelectPanel={handleSelectPanel}
                    userEmail={auth.user?.email ?? ''}
                />
                <main style={{ flex: 1, minWidth: 0, padding: 'clamp(20px, calc(10.67px + 2.92vw), 48px) clamp(16px, calc(8px + 2.5vw), 40px)' }}>
                    {renderPanel()}
                </main>
            </div>
            {state.confirmDeleteId && confirmItem && (
                <ModalDelete
                    onCancel={() => set({ confirmDeleteId: null })}
                    onConfirm={handleConfirmDelete}
                    title={'title' in confirmItem ? confirmItem.title : confirmItem.name}
                />
            )}
            {state.toast && (
                <div aria-live="polite" role="status" style={{ alignItems: 'center', animation: 'dashboard__toast-in var(--duration-slow) ease both', background: state.isToastError ? STYLES.colorErrorBackground : STYLES.colorSuccessBackground, border: `1px solid ${state.isToastError ? STYLES.colorError : STYLES.colorSuccess}`, borderRadius: 12, bottom: 36, boxShadow: STYLES.shadowToast, color: state.isToastError ? STYLES.colorError : STYLES.colorSuccess, display: 'flex', fontSize: 16, fontWeight: 600, justifyContent: 'center', left: '50%', maxWidth: 'calc(100vw - 48px)', padding: '12px 24px', position: 'fixed', textAlign: 'center', transform: 'translateX(-50%)', zIndex: 50 }}>
                    {state.toast}
                </div>
            )}
        </div>
    );
}

function ScreenLoading() {
    return (
        <div style={{ alignItems: 'center', background: STYLES.colorSurfaceRaised, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', minHeight: '100vh' }}>
            <Spinner size={64} />
            <p style={{ color: STYLES.colorGhost, fontSize: 16, margin: 0 }}>Loading&hellip;</p>
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
