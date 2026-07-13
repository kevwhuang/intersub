import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import type { Page } from '@playwright/test';

type Translations = Record<string, string>;

interface Testimonial {
    industry: string;
    name: string;
    quote: string;
    role: string;
}

const ACTIVE_DOT = /testimonials__dot--active/;
const ACTIVE_SLIDE = /testimonials__slide--active/;
const CONTENT_DIR = fileURLToPath(new URL('../../src/content', import.meta.url));
const POLL = { timeout: 10_000 };
const ROTATE_INTERVAL = 5_200;
const ROTATE_TICK = ROTATE_INTERVAL + 100;

const testimonialTranslations = loadTranslations('testimonials.json');

const testimonials = readdirSync(join(CONTENT_DIR, 'testimonials'))
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => JSON.parse(readFileSync(join(CONTENT_DIR, 'testimonials', file), 'utf-8')) as Testimonial);

const uiTranslations = loadTranslations('ui.json');

async function anchorAtSlide(page: Page, index: number) {
    await page.locator(`[data-dot="${index}"]`).click();
    await expect(page.locator(`[data-slide="${index}"]`)).toHaveClass(ACTIVE_SLIDE);
    await page.mouse.move(0, 0);
}

function loadTranslations(file: string) {
    return JSON.parse(readFileSync(join(CONTENT_DIR, 'translations', file), 'utf-8')) as Translations;
}

function waitForPageInit(page: Page) {
    const inlineOpacity = () => page.locator('.testimonials__eyebrow').evaluate(element => element.style.opacity);

    return expect.poll(inlineOpacity, POLL).toBe('1');
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('testimonials', () => {
    test.describe('rendering', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/');
            await waitForPageInit(page);
        });

        test('renders every testimonial from the content files', async ({ page }) => {
            const dots = page.locator('[data-dot]');
            const slides = page.locator('[data-slide]');

            await expect(slides).toHaveCount(testimonials.length);
            await expect(dots).toHaveCount(testimonials.length);

            for (const [index, testimonial] of testimonials.entries()) {
                const slide = slides.nth(index);

                await expect(slide.locator('.testimonials__quote span')).toHaveText(testimonial.quote);
                await expect(slide.locator('.testimonials__name')).toHaveText(testimonial.name);
                await expect(slide.locator('.testimonials__role')).toHaveText(testimonial.role);
                await expect(slide.locator('.testimonials__industry')).toHaveText(testimonial.industry);
            }
        });

        test('shows only the first slide and dot as active initially', async ({ page }) => {
            const secondSlide = page.locator('[data-slide="1"]');

            await expect(page.locator('[data-slide="0"]')).toHaveClass(ACTIVE_SLIDE);
            await expect(page.locator('.testimonials__slide--active')).toHaveCount(1);
            await expect(page.locator('[data-dot="0"]')).toHaveClass(ACTIVE_DOT);
            await expect(page.locator('.testimonials__dot--active')).toHaveCount(1);

            expect(await secondSlide.evaluate(element => getComputedStyle(element).opacity)).toBe('0');
            expect(await secondSlide.evaluate(element => getComputedStyle(element).pointerEvents)).toBe('none');
        });

        test('labels every dot with its slide number', async ({ page }) => {
            for (const [index] of testimonials.entries()) {
                const label = `Show testimonial ${index + 1}`;

                await expect(page.locator(`[data-dot="${index}"]`)).toHaveAttribute('aria-label', label);
            }
        });

        test('disables text selection on the eyebrow', async ({ page }) => {
            const eyebrow = page.locator('.testimonials__eyebrow');

            expect(await eyebrow.evaluate(element => getComputedStyle(element).userSelect)).toBe('none');
        });

        test('activates the matching slide when a dot is clicked', async ({ page }) => {
            await page.locator('[data-dot="2"]').click();

            await expect(page.locator('[data-slide="2"]')).toHaveClass(ACTIVE_SLIDE);
            await expect(page.locator('[data-slide="0"]')).not.toHaveClass(ACTIVE_SLIDE);
            await expect(page.locator('.testimonials__slide--active')).toHaveCount(1);
            await expect(page.locator('[data-dot="2"]')).toHaveClass(ACTIVE_DOT);
            await expect(page.locator('.testimonials__dot--active')).toHaveCount(1);
        });

        test('translates testimonials when the language is toggled', async ({ page }) => {
            const eyebrowText = uiTranslations['From the people in the room'];
            const toggle = page.locator('[data-lang-toggle]');

            await toggle.click();

            await expect(page.locator('.testimonials__eyebrow')).toHaveText(eyebrowText);

            for (const [index, testimonial] of testimonials.entries()) {
                const industry = testimonialTranslations[testimonial.industry];
                const label = `${uiTranslations['Show testimonial']} ${index + 1}`;
                const quote = testimonialTranslations[testimonial.quote];
                const role = testimonialTranslations[testimonial.role];
                const slide = page.locator(`[data-slide="${index}"]`);

                await expect(slide.locator('.testimonials__quote span')).toHaveText(quote);
                await expect(slide.locator('.testimonials__name')).toHaveText(testimonial.name);
                await expect(slide.locator('.testimonials__role')).toHaveText(role);
                await expect(slide.locator('.testimonials__industry')).toHaveText(industry);
                await expect(page.locator(`[data-dot="${index}"]`)).toHaveAttribute('aria-label', label);
            }

            await toggle.click();

            await expect(page.locator('[data-slide="0"] .testimonials__quote span')).toHaveText(testimonials[0].quote);
            await expect(page.locator('[data-dot="0"]')).toHaveAttribute('aria-label', 'Show testimonial 1');
        });
    });

    test.describe('rotation', () => {
        test.beforeEach(async ({ page }) => {
            await page.clock.install();
            await page.goto('/');
            await waitForPageInit(page);
        });

        test('advances to the next slide after the rotate interval', async ({ page }) => {
            await anchorAtSlide(page, 0);
            await page.clock.fastForward(ROTATE_TICK);

            await expect(page.locator('[data-slide="1"]')).toHaveClass(ACTIVE_SLIDE);
            await expect(page.locator('.testimonials__slide--active')).toHaveCount(1);
            await expect(page.locator('[data-dot="1"]')).toHaveClass(ACTIVE_DOT);
        });

        test('wraps back to the first slide after the last', async ({ page }) => {
            await anchorAtSlide(page, 0);

            for (const [index] of testimonials.entries()) {
                await page.clock.fastForward(ROTATE_TICK);

                const expected = (index + 1) % testimonials.length;

                await expect(page.locator(`[data-slide="${expected}"]`)).toHaveClass(ACTIVE_SLIDE);
            }

            await expect(page.locator('[data-slide="0"]')).toHaveClass(ACTIVE_SLIDE);
        });

        test('rotates onward from a clicked slide', async ({ page }) => {
            await anchorAtSlide(page, testimonials.length - 1);
            await page.clock.fastForward(ROTATE_TICK);

            await expect(page.locator('[data-slide="0"]')).toHaveClass(ACTIVE_SLIDE);
        });

        test('pauses while hovered and resumes when the pointer leaves', async ({ page }) => {
            await anchorAtSlide(page, 0);
            await page.locator('[data-testimonials]').hover();
            await page.clock.fastForward(ROTATE_TICK);
            await page.clock.fastForward(ROTATE_TICK);

            await expect(page.locator('[data-slide="0"]')).toHaveClass(ACTIVE_SLIDE);

            await page.mouse.move(0, 0);
            await page.clock.fastForward(ROTATE_TICK);

            await expect(page.locator('[data-slide="1"]')).toHaveClass(ACTIVE_SLIDE);
        });

        test('pauses while a dot is focused and resumes when focus leaves', async ({ page }) => {
            await anchorAtSlide(page, 0);
            await page.locator('[data-lang-toggle]').focus();
            await page.locator('[data-dot="0"]').focus();
            await page.clock.fastForward(ROTATE_TICK);
            await page.clock.fastForward(ROTATE_TICK);

            await expect(page.locator('[data-slide="0"]')).toHaveClass(ACTIVE_SLIDE);

            await page.locator('[data-lang-toggle]').focus();
            await page.clock.fastForward(ROTATE_TICK);

            await expect(page.locator('[data-slide="1"]')).toHaveClass(ACTIVE_SLIDE);
        });
    });
});
