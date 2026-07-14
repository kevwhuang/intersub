import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import TestimonialRow from '../../src/components/dashboard/TestimonialRow';
import testimonialHerry from '../../src/content/testimonials/herry-j-consultant.json';

const TESTIMONIAL: AdminTestimonial = { ...testimonialHerry, id: 'herry-j-consultant' };

function renderRow(testimonial: AdminTestimonial, isMobile = false) {
    return renderToStaticMarkup(createElement(TestimonialRow, { isMobile, onDelete: vi.fn(), onEdit: vi.fn(), testimonial }));
}

describe('TestimonialRow', () => {
    test('renders a desktop grid row with one cell per column', () => {
        const html = renderRow(TESTIMONIAL);

        expect(html).toContain('role="row"');
        expect(html).toContain('grid-template-columns:1fr 1fr 1fr 4.5fr 138px');
        expect(html.split('role="cell"').length - 1).toBe(5);
    });

    test('renders the testimonial values in their cells', () => {
        const html = renderRow(TESTIMONIAL);

        expect(html).toContain('>Herry J.</p>');
        expect(html).toContain('>Consultant</span>');
        expect(html).toContain('>Human Resources</span>');
        expect(html).toContain('Her guidance helped me secure a great offer and pass my probation smoothly.');
    });

    test('renders edit and delete actions', () => {
        const html = renderRow(TESTIMONIAL);

        expect(html).toContain('>Edit</button>');
        expect(html).toContain('>Delete</button>');
        expect(html.split('dashboard-button--outline').length - 1).toBe(1);
    });

    test('stacks the name, role, industry, and quote on mobile', () => {
        const html = renderRow(TESTIMONIAL, true);

        expect(html).not.toContain('role="row"');
        expect(html).not.toContain('role="cell"');
        expect(html).toContain('>Herry J.</p>');
        expect(html).toContain('Consultant <span aria-hidden="true">\u00B7</span> Human Resources');
        expect(html).toContain('Her guidance helped me secure a great offer and pass my probation smoothly.');
    });
});
