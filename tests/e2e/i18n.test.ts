import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import type { Page } from '@playwright/test';

type Translations = Record<string, string>;

interface EventEntry {
    date: string;
    title: string;
}

const CONTENT_DIR = fileURLToPath(new URL('../../src/content', import.meta.url));
const HERO_SUBTITLE = 'We are dedicated to enhancing English communication skills for adults and providing solutions tailored to specific workplace and life needs.';
const ZH_ACCEPT_LANGUAGE = 'zh-CN,zh;q=0.9';

const events = readdirSync(join(CONTENT_DIR, 'events'))
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(join(CONTENT_DIR, 'events', file), 'utf-8')) as EventEntry)
    .sort((entryA, entryB) => entryB.date.localeCompare(entryA.date));

const htmlTranslations = loadTranslations('html.json');
const placeholderTranslations = loadTranslations('placeholders.json');
const titleTranslations = loadTranslations('titles.json');
const uiTranslations = loadTranslations('ui.json');

function formatDateZh(date: string) {
    const [year, month, day] = date.split('-').map(Number);

    return `${year}年${month}月${day}日`;
}

async function gotoReady(page: Page, path: string) {
    await page.goto(path);
    await expect(page.locator('[data-lang-toggle]')).toHaveText(/./);
}

function loadTranslations(file: string) {
    return JSON.parse(readFileSync(join(CONTENT_DIR, 'translations', file), 'utf-8')) as Translations;
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('i18n', () => {
    test.beforeEach(async ({ page }) => {
        await gotoReady(page, '/');
    });

    test('translates hero, nav, and footer strings on the home page', async ({ page }) => {
        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
        await expect(page.locator('[data-nav-menu] a[href="/"] span')).toHaveText(uiTranslations.Home);
        await expect(page.locator('[data-nav-menu] a[href="/events"] span')).toHaveText(uiTranslations.Events);
        await expect(page.locator('.hero__subtitle')).toHaveText(uiTranslations[HERO_SUBTITLE]);
        await expect(page.locator('.site-footer__tag')).toHaveText(uiTranslations[HERO_SUBTITLE]);
        await expect(page.locator('.site-footer__heading').first()).toHaveText(uiTranslations.Directory);
        await expect(page.locator('.site-footer__bottom span').last()).toHaveText(uiTranslations['Founded by Lydia Zhu']);
    });

    test('keeps child markup through the html translation swap', async ({ page }) => {
        const copyright = page.locator('[data-i18n-html="footer-copyright"]');
        const heroTitle = page.locator('.hero__title');

        const originalCopyright = await copyright.textContent();
        const originalHeroHtml = await heroTitle.innerHTML();

        await page.locator('[data-lang-toggle]').click();

        await expect(heroTitle).toHaveText(htmlTranslations['hero-title'].replace(/<[^>]+>/g, ''));
        await expect(heroTitle.locator('span.block')).toHaveCount(2);
        await expect(heroTitle.locator('.text-cobalt-bright')).toHaveCount(2);
        await expect(copyright).toHaveText(htmlTranslations['footer-copyright'].replace('&copy;', '\u00a9'));

        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        expect(await heroTitle.innerHTML()).toBe(originalHeroHtml);
        expect(await copyright.textContent()).toBe(originalCopyright);
    });

    test('translates aria labels', async ({ page }) => {
        await expect(page.locator('.site-nav')).toHaveAttribute('aria-label', 'Primary');

        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('.site-nav')).toHaveAttribute('aria-label', uiTranslations.Primary);
        await expect(page.locator('[data-lang-toggle]')).toHaveAttribute('aria-label', uiTranslations['Switch language']);
        await expect(page.locator('.site-footer')).toHaveAttribute('aria-label', uiTranslations['Site footer']);
    });

    test('translates contact form placeholders', async ({ page }) => {
        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('input[name="name"]')).toHaveAttribute('placeholder', placeholderTranslations['Your full name']);
        await expect(page.locator('input[name="wechat"]')).toHaveAttribute('placeholder', placeholderTranslations['Your WeChat ID or phone number']);
        await expect(page.locator('input[name="email"]')).toHaveAttribute('placeholder', placeholderTranslations['you@company.com']);
        await expect(page.locator('textarea[name="message"]')).toHaveAttribute('placeholder', placeholderTranslations['Your message']);

        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('input[name="name"]')).toHaveAttribute('placeholder', 'Your full name');
    });

    test('translates the document title per page and restores it', async ({ page }) => {
        await expect(page).toHaveTitle('InterSub');

        await page.locator('[data-lang-toggle]').click();

        await expect(page).toHaveTitle(titleTranslations.InterSub);

        await page.locator('[data-lang-toggle]').click();

        await expect(page).toHaveTitle('InterSub');

        await gotoReady(page, '/events');

        await expect(page).toHaveTitle('Events \u2014 InterSub');

        await page.locator('[data-lang-toggle]').click();

        await expect(page).toHaveTitle(titleTranslations['Events \u2014 InterSub']);

        await page.locator('[data-lang-toggle]').click();

        await expect(page).toHaveTitle('Events \u2014 InterSub');
    });

    test('formats event dates in chinese on the events catalog', async ({ page }) => {
        await gotoReady(page, '/events');
        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'zh');

        for (const event of events) {
            const card = page.locator(`[data-card][href="/events/${event.date}"]`);

            await expect(card.locator('time')).toHaveText(formatDateZh(event.date));
            await expect(card.locator('.events__card-title')).toHaveText(event.title);
        }

        await expect(page.locator('[data-count]')).toHaveText(`${events.length}${uiTranslations.events}`);
    });

    test('restores english originals exactly after toggling back', async ({ page }) => {
        const heroSubtitle = page.locator('.hero__subtitle');

        const originalSubtitle = await heroSubtitle.textContent();

        await page.locator('[data-lang-toggle]').click();

        await expect(heroSubtitle).toHaveText(uiTranslations[HERO_SUBTITLE]);

        await page.locator('[data-lang-toggle]').click();

        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        expect(await heroSubtitle.textContent()).toBe(originalSubtitle);
        expect(originalSubtitle).toBe(HERO_SUBTITLE);
    });
});

test.describe('language negotiation', () => {
    test('serves chinese pre-hydration when accept-language prefers chinese', async ({ request }) => {
        const response = await request.get('/', { headers: { 'accept-language': ZH_ACCEPT_LANGUAGE } });
        const served = await response.text();

        expect(served).toContain('<html lang="zh">');
    });

    test('keeps english pre-hydration when the lang cookie is en despite a chinese accept-language', async ({ request }) => {
        const response = await request.get('/', { headers: { 'accept-language': ZH_ACCEPT_LANGUAGE, 'cookie': 'lang=en' } });
        const served = await response.text();

        expect(served).toContain('<html lang="en">');
    });
});
