import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import Testimonials from '../../src/sections/Testimonials.astro';

interface Testimonial {
    id: string;
    industry: string;
    name: string;
    quote: string;
    role: string;
}

const TESTIMONIALS_DIR = fileURLToPath(new URL('../../src/content/testimonials', import.meta.url));

const testimonials = readdirSync(TESTIMONIALS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
        id: file.replace('.json', ''),
        ...JSON.parse(readFileSync(join(TESTIMONIALS_DIR, file), 'utf-8')) as Omit<Testimonial, 'id'>,
    }));

function escapeAttribute(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

describe('Testimonials', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Testimonials);
    });

    test('renders one slide per testimonial with the first active', () => {
        expect(html.split('data-slide=').length - 1).toBe(testimonials.length);
        expect(html.split('testimonials__slide--active').length - 1).toBe(1);
        expect(html).toContain('class="testimonials__slide testimonials__slide--active" data-slide="0"');
    });

    test('renders the quote, name, role, and industry for each testimonial', () => {
        for (const testimonial of testimonials) {
            expect(html).toContain(`>${escapeText(testimonial.quote)}</span>`);
            expect(html).toContain(`>${escapeText(testimonial.name)}</span>`);
            expect(html).toContain(`>${escapeText(testimonial.role)}</span>`);
            expect(html).toContain(`>${escapeText(testimonial.industry)}</span>`);
        }
    });

    test('marks translatable text with data-i18n hooks', () => {
        for (const testimonial of testimonials) {
            expect(html).toContain(`data-i18n="${escapeAttribute(testimonial.quote)}"`);
            expect(html).toContain(`data-i18n="${escapeAttribute(testimonial.role)}"`);
            expect(html).toContain(`data-i18n="${escapeAttribute(testimonial.industry)}"`);
            expect(html).not.toContain(`data-i18n="${escapeAttribute(testimonial.name)}"`);
        }
    });

    test('renders a labeled dot button per testimonial', () => {
        expect(html.split('data-dot=').length - 1).toBe(testimonials.length);

        testimonials.forEach((_, index) => {
            expect(html).toContain(`aria-label="Show testimonial ${index + 1}"`);
        });
    });
});
