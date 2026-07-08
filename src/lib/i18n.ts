import eventTranslations from '@content/translations/events.json';
import htmlTranslations from '@content/translations/html.json';
import outcomesTranslations from '@content/translations/outcomes.json';
import placeholderTranslations from '@content/translations/placeholders.json';
import testimonialsTranslations from '@content/translations/testimonials.json';
import titleTranslations from '@content/translations/titles.json';
import uiTranslations from '@content/translations/ui.json';
import { parseDate } from '@lib/utils';

const HTML_TRANSLATIONS: Record<string, string> = htmlTranslations;
const LANG_EN = 'en';
const LANG_KEY = 'lang';
const LANG_ZH = 'zh';
const PLACEHOLDER_TRANSLATIONS: Record<string, string> = placeholderTranslations;
const TITLE_SUFFIX = ' \u2014 InterSub';
const TITLE_TRANSLATIONS: Record<string, string> = titleTranslations;

const TRANSLATIONS: Record<string, string> = {
    ...eventTranslations,
    ...outcomesTranslations,
    ...testimonialsTranslations,
    ...uiTranslations,
};

function formatDateChinese(dateString: string): string {
    const date = parseDate(dateString);

    if (Number.isNaN(date.getTime())) return dateString;

    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

export function applyLanguage() {
    const isChinese = localStorage.getItem(LANG_KEY) === LANG_ZH;

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

    if (!document.documentElement.dataset.titleOriginal) document.documentElement.dataset.titleOriginal = document.title;

    const originalTitle = document.documentElement.dataset.titleOriginal || document.title;

    if (isChinese && TITLE_TRANSLATIONS[originalTitle]) {
        document.title = TITLE_TRANSLATIONS[originalTitle];
    } else if (isChinese && originalTitle.endsWith(TITLE_SUFFIX)) {
        const prefix = originalTitle.replace(TITLE_SUFFIX, '');

        document.title = TRANSLATIONS[prefix] ? `${TRANSLATIONS[prefix]}${TITLE_SUFFIX}` : originalTitle;
    } else {
        document.title = originalTitle;
    }

    const toggle = document.querySelector<HTMLButtonElement>('[data-lang-toggle]');

    if (toggle) toggle.textContent = isChinese ? 'EN' : '中文';

    window.dispatchEvent(new CustomEvent('lang:change'));
}

export function toggleLanguage() {
    const isChinese = localStorage.getItem(LANG_KEY) === LANG_ZH;

    localStorage.setItem(LANG_KEY, isChinese ? LANG_EN : LANG_ZH);
    applyLanguage();
}

export function translate(key: string): string {
    const isChinese = localStorage.getItem(LANG_KEY) === LANG_ZH;

    return isChinese && TRANSLATIONS[key] ? TRANSLATIONS[key] : key;
}
