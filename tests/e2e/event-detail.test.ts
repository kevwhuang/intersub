import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

import { formatDate } from '../../src/lib/utils';

type Translations = Record<string, string>;

interface ContentBlock {
    content: string;
    type: 'h' | 'li' | 'p';
}

interface EventEntry {
    content: string;
    date: string;
    level?: string;
    location: string;
    time: string;
    title: string;
}

const CONTENT_DIR = fileURLToPath(new URL('../../src/content', import.meta.url));
const SLUG = '2026-06-15';

const event = JSON.parse(readFileSync(join(CONTENT_DIR, 'events', `${SLUG}.json`), 'utf-8')) as EventEntry;
const uiTranslations = JSON.parse(readFileSync(join(CONTENT_DIR, 'translations', 'ui.json'), 'utf-8')) as Translations;

const blocks = parseEventContent(event.content);
const documentTitle = `${event.title} \u2014 InterSub`;
const metaLabels = ['Date', ...event.time ? ['Time'] : [], 'Location', 'Who'];
const who = event.level ?? 'Everyone';

const headings = blocks.filter(block => block.type === 'h').map(block => block.content);
const listGroupCount = blocks.filter((block, index) => block.type === 'li' && blocks[index - 1]?.type !== 'li').length;
const listItems = blocks.filter(block => block.type === 'li').map(block => block.content);
const metaValues = [formatDate(event.date), ...event.time ? [event.time] : [], event.location, who];
const paragraphs = blocks.filter(block => block.type === 'p').map(block => block.content);

function formatDateZh(date: string) {
    const [year, month, day] = date.split('-').map(Number);

    return `${year}年${month}月${day}日`;
}

function parseEventContent(markdown: string) {
    const parsed: ContentBlock[] = [];

    for (const line of markdown.split('\n')) {
        const trimmed = line.trim();

        if (!trimmed) continue;
        if (trimmed.startsWith('## ')) parsed.push({ content: trimmed.slice(3), type: 'h' });
        else if (trimmed.startsWith('- ')) parsed.push({ content: trimmed.slice(2), type: 'li' });
        else parsed.push({ content: trimmed, type: 'p' });
    }

    return parsed;
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('event detail page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/events/${SLUG}`);
        await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);
    });

    test('renders the title and meta rows', async ({ page }) => {
        await expect(page).toHaveTitle(documentTitle);
        await expect(page.locator('.event-detail__title')).toHaveText(event.title);

        const meta = page.locator('.event-detail__meta');

        await expect(meta.locator('dt')).toHaveText(metaLabels);
        await expect(meta.locator('dd')).toHaveText(metaValues);
        await expect(meta.locator('time')).toHaveAttribute('datetime', event.date);
    });

    test('shows the cover image', async ({ page }) => {
        const cover = page.locator('.event-detail__cover-image');

        await expect(cover).toBeVisible();
        expect(await cover.getAttribute('src')).toContain(SLUG);
    });

    test('renders the markdown content as headings, lists, and paragraphs', async ({ page }) => {
        const content = page.locator('.event-detail__content');

        await expect(content.locator('h2')).toHaveText(headings);
        await expect(content.locator('ul')).toHaveCount(listGroupCount);
        await expect(content.locator('li')).toHaveText(listItems);
        await expect(content.locator('p')).toHaveText(paragraphs);
    });

    test('returns to the catalog from the back link', async ({ page }) => {
        await page.locator('.event-detail__back').click();

        await expect(page).toHaveURL('/events');
        await expect(page.locator('#events-title')).toHaveText('Events');
    });

    test('renders the 404 page for an unknown slug', async ({ page }) => {
        const response = await page.goto('/events/1999-01-01');

        expect(response?.status()).toBe(404);

        await expect(page.locator('.error-not-found__code')).toHaveText('404');
        await expect(page.locator('#error-not-found-title')).toHaveText('This page doesn\'t exist');
    });

    test('translates the title, meta, and date in chinese', async ({ page }) => {
        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
        await expect(page).toHaveTitle(documentTitle);
        await expect(page.locator('.event-detail__title')).toHaveText(event.title);

        const meta = page.locator('.event-detail__meta');

        await expect(meta.locator('dt')).toHaveText(metaLabels.map(label => uiTranslations[label] ?? label));
        await expect(meta.locator('time')).toHaveText(formatDateZh(event.date));
        await expect(meta.locator('dd').last()).toHaveText(uiTranslations[who] ?? who);
        await expect(page.locator('.event-detail__content h2')).toHaveText(headings);
    });
});
