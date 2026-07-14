import { createElement } from 'react';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import FormField from '../../src/components/dashboard/FormField';

type FormFieldProps = Parameters<typeof FormField>[0];

function renderField(overrides: Partial<FormFieldProps> = {}) {
    const props = { label: 'Title', ...overrides };

    return renderToStaticMarkup(createElement(FormField, props, createElement('input', { name: 'title' })));
}

describe('FormField', () => {
    test('wraps the control in a block label', () => {
        const html = renderField();

        expect(html).toContain('<label style="display:block">');
        expect(html).toContain('<input name="title"/>');
    });

    test('renders the label text above the control', () => {
        const html = renderField();

        expect(html).toContain('Title</span>');
        expect(html).toContain('font-size:12px');
        expect(html).toContain('font-weight:600');
        expect(html).toContain('margin-bottom:8px');
    });

    test('marks required fields with an accent asterisk', () => {
        const html = renderField({ required: true });

        expect(html).toContain('<span style="color:var(--color-cobalt)"> *</span>');
    });

    test('omits the asterisk for optional fields', () => {
        const html = renderField();

        expect(html).not.toContain('*');
    });

    test('appends a muted label suffix when provided', () => {
        const html = renderField({ labelSuffix: '(YYYY-MM-DD)' });

        expect(html).toContain('<span style="color:var(--color-slate-ghost);font-weight:500"> (YYYY-MM-DD)</span>');
    });

    test('renders the error message with its id when present', () => {
        const html = renderField({ errorId: 'error-event-title', errorMessage: 'Title is required.' });

        expect(html).toContain('<p id="error-event-title"');
        expect(html).toContain('color:var(--color-red)');
        expect(html).toContain('Title is required.</p>');
    });

    test('omits the error paragraph without an error message', () => {
        const html = renderField({ errorId: 'error-event-title' });

        expect(html).not.toContain('<p');
        expect(html).not.toContain('error-event-title');
    });
});
