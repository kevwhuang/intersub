import { useEffect, useRef } from 'react';

import Spinner from '@components/Spinner';
import { FONT_HEADING, STYLES, Z_INDEX } from '@lib/constants';
import { trapTabKey } from '@lib/utils';

export default function ModalDelete({ isDeleting, onCancel, onConfirm, title }: {
    isDeleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
}) {
    const dialogRef = useRef<HTMLDivElement>(null);

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            onCancel();

            return;
        }

        if (!dialogRef.current || event.key !== 'Tab') return;

        trapTabKey(event, dialogRef.current);
    }

    function handleMouseDown(event: MouseEvent) {
        const dialog = dialogRef.current;

        if (dialog && event.target instanceof Node && !dialog.contains(event.target)) onCancel();
    }

    useEffect(() => {
        const dialog = dialogRef.current;
        const previousElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        dialog?.querySelector<HTMLButtonElement>('button')?.focus();

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
            previousElement?.focus();
        };
    }, []);

    return (
        <div style={{ alignItems: 'center', background: STYLES.overlayBackdrop, display: 'flex', inset: 0, justifyContent: 'center', padding: 24, position: 'fixed', zIndex: Z_INDEX.modal }}>
            <div
                aria-describedby="delete-modal-text"
                aria-labelledby="delete-modal-title"
                aria-modal="true"
                ref={dialogRef}
                role="dialog"
                style={{ background: STYLES.colorSurface, borderRadius: STYLES.borderRadiusLarge, boxShadow: STYLES.shadowModal, maxWidth: 420, padding: 30, width: '100%' }}
            >
                <h2
                    id="delete-modal-title"
                    style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 10px' }}
                >
                    Delete this item?
                </h2>
                <p
                    id="delete-modal-text"
                    style={{ color: STYLES.colorMuted, fontSize: 16, lineHeight: 1.55, margin: '0 0 24px' }}
                >
                    &ldquo;
                    {title}
                    &rdquo; will be permanently deleted. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                        className="dashboard-button dashboard-button--outline"
                        disabled={isDeleting}
                        onClick={onCancel}
                        style={{ borderRadius: STYLES.borderRadiusSmall, padding: '10px 18px' }}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className="dashboard-button dashboard-button--danger dashboard-button--danger-solid"
                        disabled={isDeleting}
                        onClick={onConfirm}
                        style={{ borderRadius: STYLES.borderRadiusSmall, padding: '10px 18px' }}
                        type="button"
                    >
                        {isDeleting ? <Spinner /> : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
