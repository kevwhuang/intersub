/// <reference types="astro/client" />

declare module 'eslint-plugin-jsx-a11y';

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

interface SeminarFormData {
    content: string;
    cover: string;
    date: string;
    difficulty: string;
    location: string;
    title: string;
}

interface TestimonialFormData {
    industry: string;
    name: string;
    quote: string;
    role: string;
}
