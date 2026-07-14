/// <reference types="astro/client" />

declare module 'eslint-plugin-jsx-a11y';

type PanelKey = 'events' | 'outcomes' | 'testimonials';

type SortDirection = 'asc' | 'desc';

type Translations = Record<string, string>;

interface AdminEvent {
    content: string;
    cover?: string;
    date: string;
    id: string;
    level?: string;
    location: string;
    time: string;
    title: string;
}

interface AdminOutcome {
    id: string;
    points: string[];
    summary: string;
    title: string;
}

interface AdminTestimonial {
    id: string;
    industry: string;
    name: string;
    quote: string;
    role: string;
}

interface ButtonProps {
    onClick: () => void;
}

interface EditFormField<Values> {
    errorMessage?: string;
    isMonospace?: boolean;
    key: keyof Values & string;
    kind: 'date' | 'input' | 'select' | 'textarea';
    label: string;
    labelSuffix?: string;
    minHeight?: number;
    options?: readonly string[];
    required?: boolean;
    rows?: number;
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

interface OutcomeFormData {
    points: string;
    summary: string;
    title: string;
}

interface StoredSession {
    accessToken: string;
    email: string;
    expiresAt: number;
    refreshToken: string;
}

interface TestimonialFormData {
    industry: string;
    name: string;
    quote: string;
    role: string;
}
