export function formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString + 'T00:00:00');

    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface LevelMeta {
    bg: string;
    cover: string;
    fg: string;
    ink: string;
    label: string;
}

export function getLevelMeta(level: string) {
    const map: Record<string, LevelMeta> = {
        Advanced: { bg: 'var(--color-rose)', cover: 'var(--color-rose-cover)', fg: 'var(--color-crimson)', ink: 'var(--color-crimson)', label: 'Advanced' },
        Beginner: { bg: 'var(--color-mint)', cover: 'var(--color-mint-cover)', fg: 'var(--color-teal)', ink: 'var(--color-teal)', label: 'Beginner' },
        Intermediate: { bg: 'var(--color-cream)', cover: 'var(--color-cream-cover)', fg: 'var(--color-amber)', ink: 'var(--color-amber)', label: 'Intermediate' },
        Cohort: { bg: 'var(--color-cobalt-10)', cover: 'var(--color-cobalt-10)', fg: 'var(--color-cobalt)', ink: 'var(--color-cobalt)', label: 'Cohort' },
    };

    return map[level] ?? { bg: 'var(--color-silver)', cover: 'var(--color-pearl)', fg: 'var(--color-slate-muted)', ink: 'var(--color-slate-muted)', label: level };
}

export function getInitials(title: string): string {
    return title.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

export function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
