export default function Spinner({ size = 16 }: { size?: number }) {
    return (
        <span
            aria-hidden="true"
            style={{
                animation: 'dashboard__spin 0.6s linear infinite',
                border: `${Math.max(2, Math.round(size / 16))}px solid currentColor`,
                borderRadius: '50%',
                borderTopColor: 'transparent',
                display: 'inline-block',
                height: size,
                width: size,
            }}
        />
    );
}
