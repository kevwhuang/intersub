import { ACCENT, STYLES } from '@lib/constants';

export default function FormField({ children, errorMessage, label, labelSuffix, required }: {
    children: React.ReactNode;
    errorMessage?: string;
    label: string;
    labelSuffix?: string;
    required?: boolean;
}) {
    return (
        <label style={{ display: 'block' }}>
            <span style={STYLES.labelBase}>
                {label}
                {labelSuffix && (
                    <span style={{ color: STYLES.colorGhost, fontWeight: 500 }}>
                        {' '}
                        {labelSuffix}
                    </span>
                )}
                {required && <span style={{ color: ACCENT }}> *</span>}
            </span>
            {children}
            {errorMessage && <p style={{ color: STYLES.colorError, fontSize: 12.5, margin: '6px 0 0' }}>{errorMessage}</p>}
        </label>
    );
}
