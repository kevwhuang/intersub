export const AUTH_TOKEN_PATTERN = /(confirmation|invite|recovery)_token=([^&]+)/;
export const COBALT = 'var(--color-cobalt)';
export const COLLECTIONS = ['events', 'outcomes', 'testimonials'] as const;
export const CONTENT_DIR = 'src/content';
export const COVER_PATH_PATTERN = /^\/images\/events\/[\w-]+\.(jpe?g|png|webp)$/;
export const EMAIL_MAX = 200;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ERROR_GENERIC = 'Something went wrong. Please try again.';
export const ERROR_RATE_LIMITED = 'Too many requests. Please try again later.';
export const FOCUSABLE_SELECTOR = 'a, button';
export const FONT_HEADING = 'var(--font-heading)';
export const FONT_MONO = 'var(--font-mono)';
export const IS_DEV = import.meta.env.DEV;
export const LANG_KEY = 'lang';
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Cohort'] as const;
export const MESSAGE_MAX = 2_000;
export const NAME_MAX = 100;
export const PASSWORD_MAX = 20;
export const PASSWORD_MIN = 8;

export const ROUTES = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
] as const;

export const STYLES = {
    actionBase: {
        borderRadius: 8,
        fontSize: 12,
        padding: '8px 12px',
        width: 66,
    } as React.CSSProperties,
    border: '1px solid var(--color-silver-strong)',
    borderDivider: '1px solid var(--color-silver)',
    borderRadiusLarge: 16,
    borderRadiusSmall: 9,
    buttonNew: {
        alignItems: 'center',
        display: 'inline-flex',
        gap: 6,
        padding: '10px 16px',
        whiteSpace: 'nowrap',
    } as React.CSSProperties,
    cardBase: {
        borderBottom: '1px solid var(--color-silver-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '16px 14px',
    } as React.CSSProperties,
    cardMeta: {
        color: 'var(--color-slate-muted)',
        fontSize: 12,
        lineHeight: 1.4,
        margin: 0,
        paddingTop: 4,
    } as React.CSSProperties,
    cardTitle: {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.3,
        margin: 0,
    } as React.CSSProperties,
    cellNote: {
        color: 'var(--color-slate-muted)',
        fontSize: 12,
        lineHeight: 1.4,
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    } as React.CSSProperties,
    cellText: {
        color: 'var(--color-slate-muted)',
        fontSize: 16,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    } as React.CSSProperties,
    cellTitle: {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.3,
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    } as React.CSSProperties,
    colorError: 'var(--color-red)',
    colorErrorBackground: 'var(--color-rose)',
    colorGhost: 'var(--color-slate-ghost)',
    colorInk: 'var(--color-slate)',
    colorMuted: 'var(--color-slate-muted)',
    colorSuccess: 'var(--color-teal)',
    colorSuccessBackground: 'var(--color-mint)',
    colorSurface: 'var(--color-white)',
    colorSurface90: 'var(--color-white-90)',
    colorSurfaceRaised: 'var(--color-snow)',
    errorBase: {
        color: 'var(--color-red)',
        fontSize: 12,
        margin: 0,
    } as React.CSSProperties,
    gridEvents: '1fr 102px 92px 84px 110px 138px',
    gridOutcomes: '1fr 2fr 82px 138px',
    gridTestimonials: '1fr 1fr 1fr 4.5fr 138px',
    headerBase: {
        alignItems: 'center',
        color: 'var(--color-slate-ghost)',
        display: 'flex',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 500,
        gap: 4,
        justifyContent: 'flex-start',
        letterSpacing: '.08em',
        padding: 0,
        textAlign: 'left',
        textTransform: 'uppercase',
    } as React.CSSProperties,
    headingPanel: {
        fontSize: 'clamp(24px, calc(21.33px + 0.83vw), 32px)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        margin: '0 0 10px',
    } as React.CSSProperties,
    inputBase: {
        borderRadius: 10,
        color: 'var(--color-slate)',
        fontSize: 16,
        outline: 'none',
        padding: '12px 14px',
        width: '100%',
    } as React.CSSProperties,
    labelBase: {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 8,
    } as React.CSSProperties,
    overlayBackdrop: 'var(--color-slate-45)',
    rowBase: {
        alignItems: 'center',
        borderBottom: '1px solid var(--color-silver-light)',
        display: 'grid',
        gap: 16,
        padding: '16px 22px',
    } as React.CSSProperties,
    shadowCard: '0 1px 3px var(--color-slate-05), 0 10px 40px var(--color-slate-05)',
    shadowModal: '0 24px 60px var(--color-slate-25)',
    shadowSidebar: '0 16px 40px var(--color-slate-20)',
    shadowToast: '0 8px 24px var(--color-slate-15)',
    tableBase: {
        background: 'var(--color-white)',
        border: '1px solid var(--color-silver-strong)',
        borderRadius: 14,
        overflow: 'auto',
    } as React.CSSProperties,
    tableHeadBase: {
        alignItems: 'center',
        background: 'var(--color-snow)',
        borderBottom: '1px solid var(--color-silver)',
        display: 'grid',
        gap: 16,
        padding: '12px 22px',
    } as React.CSSProperties,
} as const;

export const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d\s*[-\u2013\u2014]\s*([01]?\d|2[0-3]):[0-5]\d$/;

export const TIMINGS = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Past', value: 'past' },
] as const;

export const TOPBAR_HEIGHT = 60;
export const TOUCH_TARGET = 48;
export const URL_PATTERN = /^https?:\/\/.+/;
export const WECHAT_MAX = 50;

export const Z_INDEX = {
    modal: 60,
    overlay: 30,
    sidebar: 35,
    toast: 50,
    topBar: 40,
} as const;
