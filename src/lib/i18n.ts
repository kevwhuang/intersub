import htmlTranslations from '@content/translations/html.json';
import outcomesTranslations from '@content/translations/outcomes.json';
import placeholderTranslations from '@content/translations/placeholders.json';
import seminarsTranslations from '@content/translations/seminars.json';
import testimonialsTranslations from '@content/translations/testimonials.json';
import titleTranslations from '@content/translations/titles.json';
import uiTranslations from '@content/translations/ui.json';

const HTML_TRANSLATIONS: Record<string, string> = htmlTranslations;
const PLACEHOLDER_TRANSLATIONS: Record<string, string> = placeholderTranslations;
const TITLE_TRANSLATIONS: Record<string, string> = titleTranslations;

const TRANSLATIONS: Record<string, string> = {
    ...uiTranslations,
    ...outcomesTranslations,
    ...seminarsTranslations,
    ...testimonialsTranslations,
};

function formatDateChinese(english: string): string {
    const date = new Date(english);

    if (Number.isNaN(date.getTime())) return english;

    return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

export function translate(key: string): string {
    const isChinese = localStorage.getItem('lang') === 'zh';

    return isChinese && TRANSLATIONS[key] ? TRANSLATIONS[key] : key;
}

export function applyLanguage() {
    const isChinese = localStorage.getItem('lang') === 'zh';

    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n || '';
        element.textContent = isChinese && TRANSLATIONS[key] ? TRANSLATIONS[key] : key;
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((element) => {
        const key = element.dataset.i18nHtml || '';

        if (!element.dataset.i18nHtmlOriginal) {
            element.dataset.i18nHtmlOriginal = element.innerHTML;
        }

        if (isChinese && HTML_TRANSLATIONS[key]) {
            element.innerHTML = HTML_TRANSLATIONS[key];
        } else if (element.dataset.i18nHtmlOriginal) {
            element.innerHTML = element.dataset.i18nHtmlOriginal;
        }
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-date]').forEach((element) => {
        const iso = element.dataset.i18nDate || '';

        if (!element.dataset.i18nDateOriginal) {
            element.dataset.i18nDateOriginal = element.textContent || '';
        }

        element.textContent = isChinese ? formatDateChinese(iso) : element.dataset.i18nDateOriginal;
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((element) => {
        const key = element.dataset.i18nPlaceholder || '';
        element.placeholder = isChinese && PLACEHOLDER_TRANSLATIONS[key] ? PLACEHOLDER_TRANSLATIONS[key] : key;
    });

    if (!document.documentElement.dataset.titleOriginal) {
        document.documentElement.dataset.titleOriginal = document.title;
    }

    const originalTitle = document.documentElement.dataset.titleOriginal || document.title;

    if (isChinese && TITLE_TRANSLATIONS[originalTitle]) {
        document.title = TITLE_TRANSLATIONS[originalTitle];
    } else if (isChinese && originalTitle.endsWith(' | InterSub')) {
        const prefix = originalTitle.replace(' | InterSub', '');
        document.title = TRANSLATIONS[prefix] ? `${TRANSLATIONS[prefix]} | InterSub` : originalTitle;
    } else {
        document.title = originalTitle;
    }

    const toggle = document.querySelector<HTMLButtonElement>('[data-lang-toggle]');

    if (toggle) toggle.textContent = isChinese ? 'EN' : '中文';

    window.dispatchEvent(new CustomEvent('lang:change'));
}

export function toggleLanguage() {
    const isChinese = localStorage.getItem('lang') === 'zh';

    localStorage.setItem('lang', isChinese ? 'en' : 'zh');
    applyLanguage();
}
