export const ROUTES = [
    { href: '/', label: 'Home' },
    { href: '/seminars', label: 'Seminars' },
] as const;

export const SOCIALS = [
    { href: 'https://linkedin.com/company/intersub', label: 'LinkedIn', mark: 'in' },
    { href: 'https://xiaohongshu.com', label: 'Xiaohongshu (RedNote)', mark: '红' },
    { href: 'https://douyin.com', label: 'Douyin (抖音)', mark: '抖' },
    { href: 'https://xiaoyuzhou.fm', label: 'Xiaoyuzhou (小宇宙)', mark: '宇' },
    { href: 'https://podcasts.apple.com', label: 'Apple Podcasts', mark: '播' },
] as const;

export const SOLUTIONS = [
    {
        desc: 'Private, focused coaching for leaders who need to perform in English under real pressure: calls, negotiations, presentations.',
        details: [
            { k: 'Format', v: 'Private 1:1' },
            { k: 'Details', v: 'Weekly · 60 min' },
            { k: 'Best for', v: 'Senior leaders' },
        ],
        title: '1:1 Executive Coaching',
    },
    {
        desc: 'Cohort training built around your team\'s actual communication: the meetings they run and the partners they email.',
        details: [
            { k: 'Format', v: 'On-site or remote' },
            { k: 'Details', v: '6–14 per cohort' },
            { k: 'Best for', v: 'Functional teams' },
        ],
        title: 'Team Workshops',
    },
    {
        desc: 'Focused sessions on a single skill: negotiation, presentations, writing. Open to individuals and small groups.',
        details: [
            { k: 'Format', v: 'Half / full day' },
            { k: 'Details', v: 'Beginner–Advanced' },
            { k: 'Best for', v: 'Targeted upskilling' },
        ],
        title: 'Seminars & Intensives',
    },
] as const;

export const METHOD_BLOCKS = [
    {
        detail: '1:1 coaching, team workshops, and focused seminars. Every engagement starts from your real work.',
        label: 'What we do',
        num: '1',
        statement: 'Training built on the situations you actually face.',
    },
    {
        detail: 'Not grammar drills. Specific, honest feedback on your actual calls, emails, and presentations.',
        label: 'How we work',
        num: '2',
        statement: 'We practise on your real work and give feedback you use the same day.',
    },
    {
        detail: 'Directors, founders, procurement leads who already command authority in Mandarin and need it in English.',
        label: 'Who we serve',
        num: '3',
        statement: 'Chinese professionals where unclear English costs deals and credibility.',
    },
    {
        detail: 'Sharper emails within days, more confident calls within weeks, fewer clarifications, faster decisions.',
        label: 'What changes',
        num: '4',
        statement: 'Not someday fluency. This week\'s meeting, run with authority.',
    },
] as const;

export interface Seminar {
    content: string;
    cover?: string;
    date: string;
    difficulty: 'advanced' | 'beginner' | 'intermediate';
    location: string;
    title: string;
}

export function formatDate(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso + 'T00:00:00');
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getInitials(title: string): string {
    return title.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

export function getDifficultyMeta(difficulty: string) {
    const map: Record<string, { bg: string; cover: string; fg: string; ink: string; label: string }> = {
        advanced: { bg: 'var(--color-error-bg)', cover: '#f4ecef', fg: 'var(--color-error-ink)', ink: '#a4324a', label: 'Advanced' },
        beginner: { bg: 'var(--color-success-bg)', cover: '#eef4f1', fg: 'var(--color-success)', ink: '#0d7a5f', label: 'Beginner' },
        intermediate: { bg: 'var(--color-warn-bg)', cover: '#f6f0e6', fg: 'var(--color-warn)', ink: '#9a5b00', label: 'Intermediate' },
    };
    return map[difficulty] ?? { bg: '#eceef2', cover: '#f0f1f4', fg: '#4a515e', ink: '#4a515e', label: difficulty };
}

export function parseSeminarContent(md: string): Array<{ c: string; type: 'h' | 'li' | 'p' }> {
    const out: Array<{ c: string; type: 'h' | 'li' | 'p' }> = [];
    for (const line of (md || '').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('## ')) out.push({ c: trimmed.slice(3), type: 'h' });
        else if (trimmed.startsWith('- ')) out.push({ c: trimmed.slice(2), type: 'li' });
        else out.push({ c: trimmed, type: 'p' });
    }
    return out;
}
