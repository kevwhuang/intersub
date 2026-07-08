export const AUTH_TOKEN_PATTERN = /(confirmation|invite|recovery)_token=([^&]+)/;
export const COBALT = 'var(--color-cobalt)';
export const COLLECTIONS = ['events', 'outcomes', 'testimonials'] as const;
export const CONTENT_DIR = 'src/content';
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const FONT_HEADING = 'var(--font-heading)';
export const FONT_MONO = 'var(--font-mono)';
export const IS_DEV = import.meta.env.DEV;
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
        padding: '7px 12px',
    } as React.CSSProperties,
    border: '1px solid var(--color-silver-strong)',
    borderMuted: '1px solid var(--color-silver-muted)',
    borderRadius: 10,
    borderRadiusLarge: 16,
    borderRadiusSmall: 9,
    colorBorder: 'var(--color-silver)',
    colorBorderHover: 'var(--color-silver-hover)',
    colorError: 'var(--color-red)',
    colorErrorBackground: 'var(--color-rose)',
    colorErrorInk: 'var(--color-crimson)',
    colorGhost: 'var(--color-slate-ghost)',
    colorInk: 'var(--color-slate)',
    colorMuted: 'var(--color-slate-muted)',
    colorRowBorder: '1px solid var(--color-silver-light)',
    colorSuccess: 'var(--color-teal)',
    colorSuccessBackground: 'var(--color-mint)',
    colorSurface: 'var(--color-white)',
    colorSurface90: 'var(--color-white-90)',
    colorSurfaceRaised: 'var(--color-snow)',
    gridEvents: '1fr 120px 120px 130px 114px',
    headerBase: {
        alignItems: 'center',
        color: 'var(--color-slate-ghost)',
        display: 'flex',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 500,
        gap: 5,
        justifyContent: 'flex-start',
        letterSpacing: '.08em',
        padding: 0,
        textAlign: 'left',
        textTransform: 'uppercase',
    } as React.CSSProperties,
    inputBase: {
        borderRadius: 10,
        color: 'var(--color-slate)',
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
    overlayBackdrop: 'var(--color-slate-45)',
    overlayLight: 'var(--color-slate-35)',
    shadowCard: '0 1px 3px var(--color-slate-05), 0 10px 40px var(--color-slate-05)',
    shadowModal: '0 24px 60px var(--color-slate-25)',
    shadowSidebar: '0 16px 40px var(--color-slate-20)',
    shadowToast: '0 8px 24px var(--color-slate-15)',
} as const;

export const TIMEZONE = 'Asia/Shanghai';
export const URL_PATTERN = /^https?:\/\/.+/;
