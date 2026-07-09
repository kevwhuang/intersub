import { useEffect, useRef } from 'react';

import { FONT_HEADING, STYLES } from '@lib/constants';

export default function DeleteModal({ onCancel, onConfirm, title }: {
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
}) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        const previousElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        dialog?.querySelector<HTMLButtonElement>('button')?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onCancel();

                return;
            }

            if (event.key !== 'Tab' || !dialog) return;

            const buttons = dialog.querySelectorAll<HTMLButtonElement>('button');

            const first = buttons[0];
            const last = buttons[buttons.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function handleMouseDown(event: MouseEvent) {
            if (dialog && event.target instanceof Node && !dialog.contains(event.target)) onCancel();
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
            previousElement?.focus();
        };
    }, []);

    return (
        <div style={{ alignItems: 'center', background: STYLES.overlayBackdrop, display: 'flex', inset: 0, justifyContent: 'center', padding: 24, position: 'fixed', zIndex: 60 }}>
            <div aria-describedby="delete-modal-text" aria-labelledby="delete-modal-title" aria-modal="true" ref={dialogRef} role="dialog" style={{ background: STYLES.colorSurface, borderRadius: STYLES.borderRadiusLarge, boxShadow: STYLES.shadowModal, maxWidth: 420, padding: 30, width: '100%' }}>
                <h3 id="delete-modal-title" style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 10px' }}>Delete this item?</h3>
                <p id="delete-modal-text" style={{ color: STYLES.colorMuted, fontSize: 16, lineHeight: 1.55, margin: '0 0 24px' }}>
                    &ldquo;
                    {title}
                    &rdquo; will be permanently deleted. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="dashboard-button dashboard-button--outline" onClick={onCancel} style={{ borderRadius: STYLES.borderRadiusSmall, padding: '10px 18px' }}>
                        Cancel
                    </button>
                    <button className="dashboard-button dashboard-button--danger dashboard-button--danger-solid" onClick={onConfirm} style={{ borderRadius: STYLES.borderRadiusSmall, padding: '10px 18px' }}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
