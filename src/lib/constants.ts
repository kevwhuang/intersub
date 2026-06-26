export const COBALT = '#2a52e0';
export const FONT_HEADING = '\'Space Grotesk\', system-ui, sans-serif';
export const FONT_MONO = '\'IBM Plex Mono\', ui-monospace, monospace';

export const METHOD_BLOCKS = [
    {
        detail: '1:1 coaching, team workshops, and focused events. Every engagement starts from your real work.',
        label: 'What we do',
        step: '1',
        statement: 'Training built on the situations you actually face.',
    },
    {
        detail: 'Not grammar drills. Specific, honest feedback on your actual calls, emails, and presentations.',
        label: 'How we work',
        step: '2',
        statement: 'We practise on your real work and give feedback you use the same day.',
    },
    {
        detail: 'Directors, founders, procurement leads who already command authority in Mandarin and need it in English.',
        label: 'Who we serve',
        step: '3',
        statement: 'Chinese professionals where unclear English costs deals and credibility.',
    },
    {
        detail: 'Sharper emails within days, more confident calls within weeks, fewer clarifications, faster decisions.',
        label: 'What changes',
        step: '4',
        statement: 'Not someday fluency. This week\'s meeting, run with authority.',
    },
] as const;

export const ROUTES = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
] as const;

export const SOCIALS = [
    { href: 'https://xiaoyuzhoufm.com/podcast/6911ae852e59334c8539c411', label: 'Xiaoyuzhou (小宇宙)' },
    { href: 'https://podcasts.apple.com/cn/podcast/id1856157603', label: 'Apple Podcasts' },
    { label: 'Xiaohongshu (RedNote)' },
    { label: 'Douyin (抖音)' },
] as const;

export const SOLUTIONS = [
    {
        desc: 'Private, focused coaching for leaders who need to perform in English under real pressure: calls, negotiations, presentations.',
        details: [
            { label: 'Format', value: 'Private 1:1' },
            { label: 'Details', value: 'Weekly · 60 min' },
            { label: 'Best for', value: 'Senior leaders' },
        ],
        title: '1:1 Executive Coaching',
    },
    {
        desc: 'Cohort training built around your team\'s actual communication: the meetings they run and the partners they email.',
        details: [
            { label: 'Format', value: 'On-site or remote' },
            { label: 'Details', value: '6–14 per cohort' },
            { label: 'Best for', value: 'Functional teams' },
        ],
        title: 'Team Workshops',
    },
    {
        desc: 'Focused sessions on a single skill: negotiation, presentations, writing. Open to individuals and small groups.',
        details: [
            { label: 'Format', value: 'Half / full day' },
            { label: 'Details', value: 'Beginner–Advanced' },
            { label: 'Best for', value: 'Targeted upskilling' },
        ],
        title: 'Events & Intensives',
    },
] as const;

export const STYLES = {
    border: '1px solid #e4e7ec',
    borderMuted: '1px solid #dfe2e8',
    borderRadius: 10,
    borderRadiusLg: 16,
    borderRadiusSm: 9,
    colorBorder: '#eceef2',
    colorBorderHover: '#d4d8e0',
    colorError: '#c0392b',
    colorErrorBg: '#fbe9ee',
    colorErrorInk: '#a4324a',
    colorErrorSoft: '#e0a0a0',
    colorGhost: '#6e7482',
    colorInk: '#14161c',
    colorInkSoft: '#3f4654',
    colorMuted: '#4a515e',
    colorRowBorder: '1px solid #f1f2f5',
    colorSuccess: '#0d7a5f',
    colorSuccessBg: '#e7f4ef',
    colorSurface: '#ffffff',
    colorSurface90: '#ffffffe6',
    colorSurfaceRaised: '#f7f8fa',
    inputBase: {
        borderRadius: 10,
        color: '#14161c',
        fontFamily: 'inherit',
        fontSize: 16,
        outline: 'none',
        padding: '12px 14px',
        width: '100%',
    } as React.CSSProperties,
    labelBase: {
        display: 'block' as const,
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 7,
    } as React.CSSProperties,
    overlayBackdrop: '#14161c73',
    overlayLight: '#14161c59',
    shadowCard: '0 1px 3px #14161c0a, 0 10px 40px #14161c0f',
    shadowModal: '0 24px 60px #14161c40',
    shadowSidebar: '0 16px 40px #14161c2e',
    shadowToast: '0 8px 24px #14161c29',
} as const;
