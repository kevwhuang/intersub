import { STYLES } from '@lib/constants';

export default function RowActions({ isMobile, onDelete, onEdit }: {
    isMobile: boolean;
    onDelete: () => void;
    onEdit: () => void;
}) {
    const buttonStyle = isMobile ? { ...STYLES.actionBase, flex: 1, padding: '14px 12px' } : STYLES.actionBase;

    return (
        <div role={isMobile ? undefined : 'cell'} style={{ display: 'flex', gap: 6 }}>
            <button className="dashboard-button dashboard-button--outline" onClick={onEdit} style={buttonStyle} type="button">Edit</button>
            <button className="dashboard-button dashboard-button--danger" onClick={onDelete} style={buttonStyle} type="button">Delete</button>
        </div>
    );
}
