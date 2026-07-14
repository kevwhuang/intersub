import RowActions from '@components/dashboard/RowActions';
import { STYLES } from '@lib/constants';

export default function TestimonialRow({ isMobile, onDelete, onEdit, testimonial }: {
    isMobile: boolean;
    onDelete: () => void;
    onEdit: () => void;
    testimonial: AdminTestimonial;
}) {
    if (isMobile) {
        return (
            <div style={STYLES.cardBase}>
                <div>
                    <p style={STYLES.cardTitle}>{testimonial.name}</p>
                    <p style={STYLES.cardMeta}>
                        {testimonial.role}
                        {' '}
                        <span aria-hidden="true">&middot;</span>
                        {' '}
                        {testimonial.industry}
                    </p>
                    <p style={{ ...STYLES.cardMeta, overflow: 'hidden', paddingTop: 6, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {testimonial.quote}
                    </p>
                </div>
                <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
            </div>
        );
    }

    return (
        <div
            role="row"
            style={{ ...STYLES.rowBase, gridTemplateColumns: STYLES.gridTestimonials }}
        >
            <p
                role="cell"
                style={STYLES.cellTitle}
            >
                {testimonial.name}
            </p>
            <span
                role="cell"
                style={STYLES.cellText}
            >
                {testimonial.role}
            </span>
            <span
                role="cell"
                style={STYLES.cellText}
            >
                {testimonial.industry}
            </span>
            <p
                role="cell"
                style={STYLES.cellNote}
            >
                {testimonial.quote}
            </p>
            <RowActions isMobile={isMobile} onDelete={onDelete} onEdit={onEdit} />
        </div>
    );
}
