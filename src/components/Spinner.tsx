export default function Spinner({ size = 16 }: { size?: number }) {
    return (
        <span
            style={{
                animation: 'dashboard__spin 0.6s linear infinite',
                border: '2px solid currentColor',
                borderRadius: '50%',
                borderTopColor: 'transparent',
                display: 'inline-block',
                height: size,
                width: size,
            }}
        />
    );
}
