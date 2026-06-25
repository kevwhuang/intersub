export const ACCENT = '#2a52e0';
export const FONT_HEADING = '\'Space Grotesk\', sans-serif';
export const FONT_MONO = '\'IBM Plex Mono\', monospace';

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

export const STYLES = {
    border: '1px solid #e4e7ec',
    borderMuted: '1px solid #dfe2e8',
    borderRadius: 10,
    borderRadiusLg: 16,
    borderRadiusSm: 9,
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
