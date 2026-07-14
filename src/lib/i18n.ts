import descriptionTranslations from '@content/translations/descriptions.json';
import htmlTranslations from '@content/translations/html.json';
import outcomesTranslations from '@content/translations/outcomes.json';
import placeholderTranslations from '@content/translations/placeholders.json';
import testimonialsTranslations from '@content/translations/testimonials.json';
import titleTranslations from '@content/translations/titles.json';
import uiTranslations from '@content/translations/ui.json';
import { LANG_KEY } from '@lib/constants';
import { parseDate } from '@lib/utils';

const DESCRIPTION_TRANSLATIONS: Record<string, string> = descriptionTranslations;
const HTML_TRANSLATIONS: Record<string, string> = htmlTranslations;
const LANG_EN = 'en';
const LANG_MAX_AGE = 31_536_000;
const LANG_ZH = 'zh';
const PLACEHOLDER_TRANSLATIONS: Record<string, string> = placeholderTranslations;
const TITLE_SUFFIX = ' \u2014 InterSub';
const TITLE_TRANSLATIONS: Record<string, string> = titleTranslations;

const TRANSLATIONS: Record<string, string> = {
    ...outcomesTranslations,
    ...testimonialsTranslations,
    ...uiTranslations,
};

function formatDateChinese(dateString: string): string {
    const date = parseDate(dateString);

    if (Number.isNaN(date.getTime())) return dateString;

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function persistLanguage(lang: string): void {
    try {
        document.cookie = `${LANG_KEY}=${lang}; path=/; max-age=${LANG_MAX_AGE}; samesite=lax`;
        localStorage.setItem(LANG_KEY, lang);
    } catch {
        return;
    }
}

function readLanguage(): string | null {
    try {
        return localStorage.getItem(LANG_KEY);
    } catch {
        return null;
    }
}

export function applyLanguage() {
    const stored = readLanguage();

    const isChinese = stored !== null ? stored === LANG_ZH : document.documentElement.lang === LANG_ZH;

    persistLanguage(isChinese ? LANG_ZH : LANG_EN);

    document.documentElement.lang = isChinese ? LANG_ZH : LANG_EN;

    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n || '';

        element.textContent = isChinese && TRANSLATIONS[key] ? TRANSLATIONS[key] : key;
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((element) => {
        const key = element.dataset.i18nHtml || '';

        if (!element.dataset.i18nHtmlOriginal) element.dataset.i18nHtmlOriginal = element.innerHTML;

        if (isChinese && HTML_TRANSLATIONS[key]) {
            element.innerHTML = HTML_TRANSLATIONS[key];
        } else if (element.dataset.i18nHtmlOriginal) {
            element.innerHTML = element.dataset.i18nHtmlOriginal;
        }
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-date]').forEach((element) => {
        const dateString = element.dataset.i18nDate || '';

        if (!element.dataset.i18nDateOriginal) element.dataset.i18nDateOriginal = element.textContent || '';

        element.textContent = isChinese ? formatDateChinese(dateString) : element.dataset.i18nDateOriginal;
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((element) => {
        const key = element.dataset.i18nAria || '';

        element.setAttribute('aria-label', isChinese && TRANSLATIONS[key] ? TRANSLATIONS[key] : key);
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((element) => {
        const key = element.dataset.i18nPlaceholder || '';

        element.placeholder = isChinese && PLACEHOLDER_TRANSLATIONS[key] ? PLACEHOLDER_TRANSLATIONS[key] : key;
    });

    const canonicalTitle = document.querySelector<HTMLMetaElement>('meta[name="title-en"]')?.content;

    if (canonicalTitle) document.title = translateTitle(canonicalTitle, isChinese);

    const toggle = document.querySelector<HTMLButtonElement>('[data-lang-toggle]');

    if (toggle) toggle.textContent = isChinese ? 'EN' : '中文';

    window.dispatchEvent(new CustomEvent('lang:change'));
}

export function toggleLanguage() {
    const isChinese = readLanguage() === LANG_ZH;

    persistLanguage(isChinese ? LANG_EN : LANG_ZH);
    applyLanguage();
}

export function translate(key: string): string {
    const isChinese = readLanguage() === LANG_ZH;

    return isChinese && TRANSLATIONS[key] ? TRANSLATIONS[key] : key;
}

export function translateDescription(description: string, isChinese: boolean): string {
    return isChinese && DESCRIPTION_TRANSLATIONS[description] ? DESCRIPTION_TRANSLATIONS[description] : description;
}

export function translateTitle(title: string, isChinese: boolean): string {
    if (!isChinese) return title;

    if (TITLE_TRANSLATIONS[title]) return TITLE_TRANSLATIONS[title];

    if (title.endsWith(TITLE_SUFFIX)) {
        const prefix = title.replace(TITLE_SUFFIX, '');

        return TRANSLATIONS[prefix] ? `${TRANSLATIONS[prefix]}${TITLE_SUFFIX}` : title;
    }

    return title;
}
