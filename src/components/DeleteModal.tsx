import { FONT_HEADING, STYLES } from '@lib/constants';

export default function DeleteModal({ onCancel, onConfirm, title }: {
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
}) {
    function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget) onCancel();
    }

    function handleBackdropKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Escape') onCancel();
    }

    return (
        <div role="button" tabIndex={-1} onClick={handleBackdropClick} onKeyDown={handleBackdropKeyDown} style={{ alignItems: 'center', background: 'rgba(20,22,28,.45)', display: 'flex', inset: 0, justifyContent: 'center', padding: 24, position: 'fixed', zIndex: 60 }}>
            <div role="dialog" aria-labelledby="delete-modal-title" style={{ background: '#ffffff', borderRadius: STYLES.borderRadiusLg, boxShadow: '0 24px 60px rgba(20,22,28,.25)', maxWidth: 400, padding: 'clamp(20px, 4vw, 30px)', width: '100%' }}>
                <h3 id="delete-modal-title" style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 10px' }}>Delete this item?</h3>
                <p style={{ color: STYLES.colorMuted, fontSize: 14.5, lineHeight: 1.55, margin: '0 0 24px' }}>
                    &ldquo;
                    {title}
                    &rdquo; will be permanently deleted. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="dashboard-button--outline" onClick={onCancel} style={{ borderRadius: STYLES.borderRadiusSm, fontSize: 14, padding: '10px 18px' }}>
                        Cancel
                    </button>
                    <button className="dashboard-button--danger" onClick={onConfirm} style={{ background: STYLES.colorError, borderColor: STYLES.colorError, borderRadius: STYLES.borderRadiusSm, color: '#ffffff', fontSize: 14, padding: '10px 18px' }}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
