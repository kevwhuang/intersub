import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { translate, translateDescription, translateTitle } from '../../src/lib/i18n';

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

describe('translate', () => {
    beforeEach(() => {
        storage.clear();
        vi.stubGlobal('localStorage', localStorageStub);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

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
