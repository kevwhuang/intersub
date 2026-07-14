import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import PanelTestimonials from '../../src/components/dashboard/PanelTestimonials';
import testimonialHerry from '../../src/content/testimonials/herry-j-consultant.json';
import testimonialJason from '../../src/content/testimonials/jason-z-founder.json';

type PanelProps = Parameters<typeof PanelTestimonials>[0];

const TESTIMONIALS: AdminTestimonial[] = [
    { ...testimonialHerry, id: 'herry-j-consultant' },
    { ...testimonialJason, id: 'jason-z-founder' },
];

function renderPanel(overrides: Partial<PanelProps> = {}) {
    return renderToStaticMarkup(createElement(PanelTestimonials, {
        editingTestimonialId: null,
        isMobile: false,
        isSaving: false,
        onCancelEdit: vi.fn(),
        onRequestDelete: vi.fn(),
        onSave: vi.fn(),
        onSort: vi.fn(),
        onStartEdit: vi.fn(),
        onStartNew: vi.fn(),
        onUpdate: vi.fn(),
        sortDirection: 'asc',
        sortKey: 'name',
        testimonialForm: null,
        testimonialFormErrors: {},
        testimonials: TESTIMONIALS,
        ...overrides,
    }));
}

describe('PanelTestimonials', () => {
    test('renders the heading with the entry count and new button', () => {
        const html = renderPanel();

        expect(html).toContain('>Testimonials</h1>');
        expect(html).toContain('2 testimonials');
        expect(html).toContain('+\u2002New testimonial');
    });

    test('renders sortable name, role, and industry headers', () => {
        const html = renderPanel();

        expect(html.split('role="columnheader"').length - 1).toBe(5);
        expect(html).toContain('>Quote</span>');
        expect(html).toContain('>Actions</span>');
        expect(html.split('dashboard-button--ghost').length - 1).toBe(3);
    });

    test('marks the sorted column ascending with an up arrow', () => {
        const html = renderPanel();

        expect(html).toContain('aria-sort="ascending"');
        expect(html).toContain('Name \u2191</button>');
        expect(html.split('aria-sort="none"').length - 1).toBe(2);
    });

    test('marks the sorted column descending with a down arrow', () => {
        const html = renderPanel({ sortDirection: 'desc', sortKey: 'role' });

        expect(html).toContain('aria-sort="descending"');
        expect(html).toContain('Role \u2193</button>');
        expect(html).toContain('Name</button>');
        expect(html.split('aria-sort="none"').length - 1).toBe(2);
    });

    test('renders one row per testimonial plus the header row', () => {
        const html = renderPanel();

        expect(html.split('role="row"').length - 1).toBe(3);
        expect(html).toContain('>Herry J.</p>');
        expect(html).toContain('>Consultant</span>');
        expect(html).toContain('>Human Resources</span>');
        expect(html).toContain('>Jason Z.</p>');
        expect(html).toContain('>Founder</span>');
        expect(html).toContain('Her guidance helped me secure a great offer');
        expect(html).toContain('made a huge difference in my pitches');
    });

    test('stacks entries without table semantics on mobile', () => {
        const html = renderPanel({ isMobile: true });

        expect(html).not.toContain('role="table"');
        expect(html).not.toContain('aria-sort=');
        expect(html).toContain('Consultant <span aria-hidden="true">\u00B7</span> Human Resources');
        expect(html).toContain('Founder <span aria-hidden="true">\u00B7</span> Consulting');
    });

    test('shows the empty state when there are no testimonials', () => {
        const html = renderPanel({ testimonials: [] });

        expect(html).toContain('No testimonials found');
        expect(html).toContain('Try a different search, or add a new testimonial.');
        expect(html).not.toContain('role="table"');
    });

    test('renders the edit form populated with the testimonial values', () => {
        const html = renderPanel({
            editingTestimonialId: 'herry-j-consultant',
            testimonialForm: { industry: testimonialHerry.industry, name: testimonialHerry.name, quote: testimonialHerry.quote, role: testimonialHerry.role },
        });

        expect(html).toContain('>Edit testimonial</h1>');
        expect(html).toContain('value="Herry J."');
        expect(html).toContain('value="Consultant"');
        expect(html).toContain('value="Human Resources"');
        expect(html).toContain('Her guidance helped me secure a great offer');
        expect(html).toContain('aria-label="Save changes"');
        expect(html).toContain('>Delete testimonial</button>');
    });

    test('renders the create form without a delete action', () => {
        const html = renderPanel({
            editingTestimonialId: 'new',
            testimonialForm: { industry: '', name: '', quote: '', role: '' },
        });

        expect(html).toContain('>New testimonial</h1>');
        expect(html).toContain('aria-label="Create testimonial"');
        expect(html).not.toContain('Delete testimonial');
    });

    test('renders validation errors against their fields', () => {
        const html = renderPanel({
            editingTestimonialId: 'new',
            testimonialForm: { industry: '', name: '', quote: '', role: '' },
            testimonialFormErrors: { industry: true, name: true, quote: true, role: true },
        });

        expect(html).toContain('Name is required.');
        expect(html).toContain('Role is required.');
        expect(html).toContain('Industry is required.');
        expect(html).toContain('Quote is required.');
        expect(html).toContain('id="error-testimonial-name"');
        expect(html).toContain('aria-describedby="error-testimonial-quote"');
        expect(html.split('dashboard-input--error').length - 1).toBe(4);
    });
});
