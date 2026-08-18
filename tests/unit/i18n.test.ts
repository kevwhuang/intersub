import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import htmlTranslations from '../../src/content/translations/html.json';
import { applyLanguage, toggleLanguage, translate, translateDescription, translateTitle } from '../../src/lib/i18n';

import type { Mock } from 'vitest';

interface DomOptions {
    lang: string;
    title: string;
}

interface ElementStub {
    dataset: Record<string, string | undefined>;
    innerHTML: string;
    placeholder: string;
    setAttribute: Mock<(name: string, value: string) => void>;
    textContent: string;
}

const HOME_DESCRIPTION = 'Business English training for Chinese professionals. Private coaching, team workshops, and focused events. Founded by Lydia Zhu.';

const storage = new Map<string, string>();

const localStorageStub = {
    clear: () => {
        storage.clear();
    },
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => {
        storage.delete(key);
    },
    setItem: (key: string, value: string) => {
        storage.set(key, value);
    },
};

function buildElement(overrides: Partial<ElementStub> = {}): ElementStub {
    return {
        dataset: {},
        innerHTML: '',
        placeholder: '',
        setAttribute: vi.fn(),
        textContent: '',
        ...overrides,
    };
}

function createLanguageDom(elements: Record<string, ElementStub[]> = {}, options: Partial<DomOptions> = {}) {
    const cookies: string[] = [];
    const dispatchEvent = vi.fn();
    const meta = options.title === undefined ? null : { content: options.title };
    const toggle = buildElement();

    const documentStub = {
        set cookie(value: string) {
            cookies.push(value);
        },
        documentElement: { lang: options.lang ?? 'en' },
        querySelector: (selector: string) => (selector === 'meta[name="title-en"]' ? meta : toggle),
        querySelectorAll: (selector: string) => elements[selector] ?? [],
        title: '',
    };

    vi.stubGlobal('document', documentStub);
    vi.stubGlobal('window', { dispatchEvent });

    return { cookies, dispatchEvent, documentStub, toggle };
}

beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', localStorageStub);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('applyLanguage', () => {
    test('replaces mapped data-i18n text in chinese and keeps unmapped keys', () => {
        const mapped = buildElement({ dataset: { i18n: 'Events' } });
        const unmapped = buildElement({ dataset: { i18n: 'An untranslated string' } });

        createLanguageDom({ '[data-i18n]': [mapped, unmapped] });
        localStorage.setItem('lang', 'zh');

        applyLanguage();

        expect(mapped.textContent).toBe('活动');
        expect(unmapped.textContent).toBe('An untranslated string');
    });

    test('captures the original html once and restores it in english', () => {
        const hero = buildElement({ dataset: { i18nHtml: 'hero-title' }, innerHTML: '<span>Original</span>' });

        createLanguageDom({ '[data-i18n-html]': [hero] });
        localStorage.setItem('lang', 'zh');

        applyLanguage();

        expect(hero.innerHTML).toBe(htmlTranslations['hero-title']);
        expect(hero.dataset.i18nHtmlOriginal).toBe('<span>Original</span>');

        applyLanguage();

        expect(hero.dataset.i18nHtmlOriginal).toBe('<span>Original</span>');

        localStorage.setItem('lang', 'en');
        applyLanguage();

        expect(hero.innerHTML).toBe('<span>Original</span>');
    });

    test('renders dates in chinese and restores the original text in english', () => {
        const date = buildElement({ dataset: { i18nDate: '2026-06-15' }, textContent: 'Jun 15, 2026' });

        createLanguageDom({ '[data-i18n-date]': [date] });
        localStorage.setItem('lang', 'zh');

        applyLanguage();

        expect(date.textContent).toBe('2026年6月15日');

        localStorage.setItem('lang', 'en');
        applyLanguage();

        expect(date.textContent).toBe('Jun 15, 2026');
    });

    test('passes an unparseable date through unchanged', () => {
        const date = buildElement({ dataset: { i18nDate: 'not-a-date' }, textContent: 'someday' });

        createLanguageDom({ '[data-i18n-date]': [date] });
        localStorage.setItem('lang', 'zh');

        applyLanguage();

        expect(date.textContent).toBe('not-a-date');
    });

    test('swaps aria-labels and placeholders with the language', () => {
        const aria = buildElement({ dataset: { i18nAria: 'Events' } });
        const input = buildElement({ dataset: { i18nPlaceholder: 'Your full name' } });

        createLanguageDom({ '[data-i18n-aria]': [aria], '[data-i18n-placeholder]': [input] });
        localStorage.setItem('lang', 'zh');

        applyLanguage();

        expect(aria.setAttribute).toHaveBeenLastCalledWith('aria-label', '活动');
        expect(input.placeholder).toBe('您的姓名');

        localStorage.setItem('lang', 'en');
        applyLanguage();

        expect(aria.setAttribute).toHaveBeenLastCalledWith('aria-label', 'Events');
        expect(input.placeholder).toBe('Your full name');
    });

    test('drives document.title from the canonical title meta', () => {
        const { documentStub } = createLanguageDom({}, { title: 'Events \u2014 InterSub' });

        localStorage.setItem('lang', 'zh');
        applyLanguage();

        expect(documentStub.title).toBe('活动 \u2014 言际阁');

        localStorage.setItem('lang', 'en');
        applyLanguage();

        expect(documentStub.title).toBe('Events \u2014 InterSub');
    });

    test('shows EN on the toggle in chinese and the chinese label in english', () => {
        const { toggle } = createLanguageDom();

        localStorage.setItem('lang', 'zh');
        applyLanguage();

        expect(toggle.textContent).toBe('EN');

        localStorage.setItem('lang', 'en');
        applyLanguage();

        expect(toggle.textContent).toBe('中文');
    });

    test('dispatches a lang:change event on window', () => {
        const { dispatchEvent } = createLanguageDom();

        applyLanguage();

        expect(dispatchEvent).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: 'lang:change' }));
    });

    test('persists the resolved language to cookie and localStorage', () => {
        const { cookies } = createLanguageDom({}, { lang: 'zh' });

        applyLanguage();

        expect(cookies).toEqual(['lang=zh; path=/; max-age=31536000; samesite=lax']);
        expect(storage.get('lang')).toBe('zh');
    });

    test('still applies chinese when localStorage setItem throws', () => {
        const { cookies, toggle } = createLanguageDom({}, { lang: 'zh' });

        vi.stubGlobal('localStorage', {
            getItem: () => null,
            setItem: () => {
                throw new Error('quota exceeded');
            },
        });

        applyLanguage();

        expect(cookies).toEqual(['lang=zh; path=/; max-age=31536000; samesite=lax']);
        expect(toggle.textContent).toBe('EN');
    });
});

describe('toggleLanguage', () => {
    test('flips chinese to english and back persisting each flip', () => {
        const { documentStub, toggle } = createLanguageDom();

        localStorage.setItem('lang', 'zh');

        toggleLanguage();

        expect(storage.get('lang')).toBe('en');
        expect(documentStub.documentElement.lang).toBe('en');
        expect(toggle.textContent).toBe('中文');

        toggleLanguage();

        expect(storage.get('lang')).toBe('zh');
        expect(documentStub.documentElement.lang).toBe('zh');
        expect(toggle.textContent).toBe('EN');
    });
});

describe('translate', () => {
    test('returns the key in english mode', () => {
        expect(translate('Events')).toBe('Events');

        localStorage.setItem('lang', 'en');

        expect(translate('Events')).toBe('Events');
    });

    test('returns the mapped chinese string when lang is zh', () => {
        localStorage.setItem('lang', 'zh');

        expect(translate('Events')).toBe('活动');
        expect(translate('Home')).toBe('首页');
        expect(translate('Upcoming')).toBe('即将开始');
    });

    test('falls back to the key when zh has no entry', () => {
        localStorage.setItem('lang', 'zh');

        expect(translate('An untranslated string')).toBe('An untranslated string');
    });

    test('falls back to the key when localStorage getItem throws', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => {
                throw new Error('storage unavailable');
            },
        });

        expect(translate('Events')).toBe('Events');
    });
});

describe('translateDescription', () => {
    test('returns the description unchanged in english mode', () => {
        expect(translateDescription(HOME_DESCRIPTION, false)).toBe(HOME_DESCRIPTION);
    });

    test('returns the mapped chinese description when chinese is active', () => {
        expect(translateDescription(HOME_DESCRIPTION, true)).toBe('为中国职场人士提供的商务英语培训。一对一私教、团队工作坊与专题活动，由 Lydia Zhu 创办。');
    });

    test('falls back to english for an unknown description', () => {
        expect(translateDescription('An unknown page description.', true)).toBe('An unknown page description.');
    });
});

describe('translateTitle', () => {
    test('returns the title unchanged in english mode', () => {
        expect(translateTitle('Events \u2014 InterSub', false)).toBe('Events \u2014 InterSub');
    });

    test('returns the exact chinese title for a titles.json key', () => {
        expect(translateTitle('InterSub', true)).toBe('言际阁');
        expect(translateTitle('Events \u2014 InterSub', true)).toBe('活动 \u2014 言际阁');
        expect(translateTitle('Page Not Found \u2014 InterSub', true)).toBe('页面不存在 \u2014 言际阁');
    });

    test('composes the chinese title from a translated ui prefix', () => {
        expect(translateTitle('Outcomes \u2014 InterSub', true)).toBe('成果案例 \u2014 InterSub');
    });

    test('falls back to english when neither key nor prefix translates', () => {
        expect(translateTitle('Mystery Page \u2014 InterSub', true)).toBe('Mystery Page \u2014 InterSub');
        expect(translateTitle('Mystery Page', true)).toBe('Mystery Page');
    });
});
