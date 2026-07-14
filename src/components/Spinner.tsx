const BORDER_DIVISOR = 16;
const BORDER_MIN = 2;
const SPIN_DURATION = '0.6s';

export default function Spinner({ size = 16 }: { size?: number }) {
    return (
        <span
            aria-hidden="true"
            style={{
                animation: `dashboard__spin ${SPIN_DURATION} linear infinite`,
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
