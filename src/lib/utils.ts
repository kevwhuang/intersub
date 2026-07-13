interface LevelMeta {
    background: string;
    cover: string;
    foreground: string;
    ink: string;
}

const LEVEL_META: Record<string, LevelMeta> = {
    Advanced: { background: 'var(--color-rose)', cover: 'var(--color-rose-cover)', foreground: 'var(--color-crimson)', ink: 'var(--color-crimson)' },
    Beginner: { background: 'var(--color-mint)', cover: 'var(--color-mint-cover)', foreground: 'var(--color-teal)', ink: 'var(--color-teal)' },
    Cohort: { background: 'var(--color-cobalt-10)', cover: 'var(--color-cobalt-10)', foreground: 'var(--color-cobalt)', ink: 'var(--color-cobalt)' },
    Intermediate: { background: 'var(--color-cream)', cover: 'var(--color-cream-cover)', foreground: 'var(--color-amber)', ink: 'var(--color-amber)' },
};

const TIMEZONE = 'Asia/Shanghai';

export function formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = parseDate(dateString);

    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getInitials(title: string): string {
    return title.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

export function getLevelMeta(level: string): LevelMeta {
    return LEVEL_META[level] ?? { background: 'var(--color-silver)', cover: 'var(--color-pearl)', foreground: 'var(--color-slate-muted)', ink: 'var(--color-slate-muted)' };
}

export function getToday(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

export function parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
}
