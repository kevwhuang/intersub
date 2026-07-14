const BORDER_DIVISOR = 16;
const BORDER_MIN = 2;

export default function Spinner({ size = 16 }: { size?: number }) {
    return (
        <span
            aria-hidden="true"
            style={{
                animation: 'dashboard__spin 0.6s linear infinite',
                border: `${Math.max(BORDER_MIN, Math.round(size / BORDER_DIVISOR))}px solid currentColor`,
                borderRadius: '50%',
                borderTopColor: 'transparent',
                display: 'inline-block',
                height: size,
                width: size,
            }}
        />
    );
}
