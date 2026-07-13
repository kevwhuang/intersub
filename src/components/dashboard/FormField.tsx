import { COBALT, STYLES } from '@lib/constants';

export default function FormField({ children, errorId, errorMessage, label, labelSuffix, required }: {
    children: React.ReactNode;
    errorId?: string;
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
                {required && <span style={{ color: COBALT }}> *</span>}
            </span>
            {children}
            {errorMessage && <p id={errorId} style={{ color: STYLES.colorError, fontSize: 12, margin: 0, paddingTop: 8 }}>{errorMessage}</p>}
        </label>
    );
}
