import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Contact from '../../src/sections/Contact.astro';
import { EMAIL_MAX, MESSAGE_MAX, NAME_MAX, WECHAT_MAX } from '../../src/lib/constants';

const FIELDS = ['email', 'message', 'name', 'wechat'] as const;

describe('Contact', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Contact);
    });

    test('wires the section to a rendered heading id via aria-labelledby', () => {
        expect(html).toContain('aria-labelledby="contact-title"');
        expect(html).toMatch(/<h2 id="contact-title"[^>]*data-i18n="Get in touch"/);
    });

    test('renders the form with novalidate for custom validation', () => {
        expect(html).toMatch(/<form class="contact__form[^"]*"[^>]*novalidate/);
    });

    test('renders each field inside a label', () => {
        expect(html.split('<label class="label"').length - 1).toBe(FIELDS.length);

        for (const field of FIELDS) {
            expect(html).toMatch(new RegExp(`<label[^>]*>(?:(?!</label>)[\\s\\S])*?name="${field}"`));
        }
    });

    test('caps each field at its shared max length constant', () => {
        expect(html).toContain(`maxlength="${EMAIL_MAX}" name="email"`);
        expect(html).toContain(`maxlength="${MESSAGE_MAX}" name="message"`);
        expect(html).toContain(`maxlength="${NAME_MAX}" name="name"`);
        expect(html).toContain(`maxlength="${WECHAT_MAX}" name="wechat"`);
    });

    test('marks name, wechat, and message required but not email', () => {
        expect(html.split('<span class="label__required"').length - 1).toBe(3);
        expect(html).toMatch(/name="message"[^>]*required/);
        expect(html).toMatch(/name="name"[^>]*required/);
        expect(html).toMatch(/name="wechat"[^>]*required/);

        const emailInput = html.match(/<input[^>]*name="email"[^>]*>/);

        expect(emailInput?.[0]).toBeDefined();
        expect(emailInput?.[0]).not.toContain('required');
    });

    test('links every field to its hidden error message', () => {
        for (const field of FIELDS) {
            expect(html).toContain(`aria-describedby="error-${field}"`);
            expect(html).toMatch(new RegExp(`<p id="error-${field}"[^>]*hidden`));
        }
    });

    test('renders the submit button with an i18n hook', () => {
        expect(html).toMatch(/<button[^>]*data-i18n="Send message"[^>]*type="submit"/);
    });

    test('hides the success panel and network error by default', () => {
        expect(html).toContain('<div class="contact__success" hidden');
        expect(html).toMatch(/<p class="contact__error contact__network-error"[^>]*hidden role="alert"/);
    });
});
