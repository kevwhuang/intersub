const ACCENT = '#2a52e0';

const LABEL_BASE: React.CSSProperties = {
    display: 'block',
    fontSize: 13.5,
    fontWeight: 600,
    marginBottom: 7,
};

export function FormField({ children, errorMessage, label, labelSuffix, required }: {
    children: React.ReactNode;
    errorMessage?: string;
    label: string;
    labelSuffix?: string;
    required?: boolean;
}) {
    return (
        <label style={{ display: 'block' }}>
            <span style={LABEL_BASE}>
                {label}
                {labelSuffix && (
                    <span style={{ color: '#6e7482', fontWeight: 500 }}>
                        {' '}
                        {labelSuffix}
                    </span>
                )}
                {required && <span style={{ color: ACCENT }}> *</span>}
            </span>
            {children}
            {errorMessage && <p style={{ color: '#c0392b', fontSize: 12.5, margin: '6px 0 0' }}>{errorMessage}</p>}
        </label>
    );
}
