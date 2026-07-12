import { FONT_HEADING, STYLES } from '@lib/constants';

export default function TableEmpty({ description, title }: {
    description: string;
    title: string;
}) {
    return (
        <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>{title}</p>
            <p style={{ color: STYLES.colorGhost, fontSize: 16, margin: 0 }}>{description}</p>
        </div>
    );
}
