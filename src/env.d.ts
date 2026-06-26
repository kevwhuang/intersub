/// <reference types="astro/client" />

declare module 'eslint-plugin-jsx-a11y';

interface AdminOutcome {
    id: string;
    points: string[];
    summary: string;
    title: string;
}

interface AdminEvent {
    content: string;
    cover?: string;
    date: string;
    id: string;
    level?: string;
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
    activePanel: 'events' | 'outcomes' | 'testimonials';
    adminFilters: string[];
    adminLocation: string;
    adminSearch: string;
    confirmDelete: string | null;
    confirmDeleteType: 'event' | 'outcome' | 'testimonial';
    drawerOpen: boolean;
    editing: string | null;
    editingOutcome: string | null;
    editingTestimonial: string | null;
    form: EventFormData | null;
    formErrors: Record<string, boolean>;
    loading: boolean;
    outcomeForm: OutcomeFormData | null;
    outcomeFormErrors: Record<string, boolean>;
    outcomes: AdminOutcome[];
    saving: boolean;
    events: AdminEvent[];
    sortDirection: 'asc' | 'desc';
    sortKey: string;
    testimonialForm: TestimonialFormData | null;
    testimonialFormErrors: Record<string, boolean>;
    testimonials: AdminTestimonial[];
    toast: string | null;
    toastError: boolean;
}

interface OutcomeFormData {
    points: string;
    summary: string;
    title: string;
}

interface EventFormData {
    content: string;
    cover: string;
    date: string;
    level: string;
    location: string;
    title: string;
}

interface TestimonialFormData {
    industry: string;
    name: string;
    quote: string;
    role: string;
}
