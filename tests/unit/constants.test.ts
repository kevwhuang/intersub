import { describe, expect, test } from 'vitest';

import {
    AUTH_TOKEN_PATTERN,
    COLLECTIONS,
    COVER_PATH_PATTERN,
    EMAIL_MAX,
    EMAIL_PATTERN,
    LEVELS,
    MESSAGE_MAX,
    NAME_MAX,
    PASSWORD_MAX,
    PASSWORD_MIN,
    ROUTES,
    TIME_PATTERN,
    URL_PATTERN,
    WECHAT_MAX,
} from '../../src/lib/constants';

const INVALID_COVER_PATHS = [
    '/images/team/cover.webp',
    '/images/events/../secrets.webp',
    '/images/events/nested/cover.webp',
    '/images/events/cover.gif',
    '/images/events/cover.svg',
    '/images/events/cover.WEBP',
    '/images/events/cover.webp?width=100',
    'images/events/cover.webp',
    'https://example.com/images/events/cover.webp',
] as const;

const INVALID_EMAILS = [
    'plainaddress',
    'user@nodot',
    '@example.com',
    'user@.com',
    'user @example.com',
    'user@exam ple.com',
    'user@@example.com',
] as const;

const INVALID_TIMES = [
    '24:00-01:00',
    '09:00-24:00',
    '09:60-10:00',
    '09:00-10:60',
    '9:00 AM - 10:00 AM',
    '09:00-10:30 PM',
    '09:00',
    '09:00~10:30',
    '09:00 to 10:30',
] as const;

const INVALID_URLS = [
    'ftp://example.com',
    'javascript:alert(1)',
    '//example.com',
    'example.com',
    'https://',
] as const;

const VALID_COVER_PATHS = [
    '/images/events/2026-06-15.webp',
    '/images/events/cover.jpg',
    '/images/events/cover.jpeg',
    '/images/events/cover.png',
    '/images/events/my-cover_2.webp',
] as const;

const VALID_EMAILS = [
    'user@example.com',
    'first.last+tag@sub.example.co',
    'a@b.c',
] as const;

const VALID_TIMES = [
    '09:00-10:30',
    '9:00-10:30',
    '09:00 - 10:30',
    '09:00\u201310:30',
    '09:00 \u2013 10:30',
    '19:00\u201421:00',
    '19:00 \u2014 21:00',
    '0:00-23:59',
] as const;

const VALID_URLS = [
    'http://example.com',
    'https://example.com/path?query=1',
] as const;

describe('AUTH_TOKEN_PATTERN', () => {
    test('captures confirmation tokens and stops at an ampersand', () => {
        const match = '#confirmation_token=abc123&type=signup'.match(AUTH_TOKEN_PATTERN);

        expect(match?.[1]).toBe('confirmation');
        expect(match?.[2]).toBe('abc123');
    });

    test('captures invite tokens', () => {
        const match = '#invite_token=xyz-789'.match(AUTH_TOKEN_PATTERN);

        expect(match?.[1]).toBe('invite');
        expect(match?.[2]).toBe('xyz-789');
    });

    test('captures recovery tokens', () => {
        const match = '#recovery_token=r2d2'.match(AUTH_TOKEN_PATTERN);

        expect(match?.[1]).toBe('recovery');
        expect(match?.[2]).toBe('r2d2');
    });

    test('rejects other token names and empty values', () => {
        expect('access_token=abc').not.toMatch(AUTH_TOKEN_PATTERN);
        expect('session_token=abc').not.toMatch(AUTH_TOKEN_PATTERN);
        expect('confirmation_token=').not.toMatch(AUTH_TOKEN_PATTERN);
    });
});

describe('COLLECTIONS', () => {
    test('lists the three content collections', () => {
        expect(COLLECTIONS).toEqual(['events', 'outcomes', 'testimonials']);
    });
});

describe('COVER_PATH_PATTERN', () => {
    test('accepts event covers with allowed extensions', () => {
        for (const path of VALID_COVER_PATHS) expect(path).toMatch(COVER_PATH_PATTERN);
    });

    test('rejects other directories, traversal, and other extensions', () => {
        for (const path of INVALID_COVER_PATHS) expect(path).not.toMatch(COVER_PATH_PATTERN);
    });
});

describe('EMAIL_PATTERN', () => {
    test('accepts well-formed addresses', () => {
        for (const email of VALID_EMAILS) expect(email).toMatch(EMAIL_PATTERN);
    });

    test('rejects malformed addresses', () => {
        for (const email of INVALID_EMAILS) expect(email).not.toMatch(EMAIL_PATTERN);
    });
});

describe('LEVELS', () => {
    test('lists the four levels in display order', () => {
        expect(LEVELS).toEqual(['Beginner', 'Intermediate', 'Advanced', 'Cohort']);
    });
});

describe('ROUTES', () => {
    test('lists the public navigation routes', () => {
        expect(ROUTES).toEqual([
            { href: '/', label: 'Home' },
            { href: '/events', label: 'Events' },
        ]);
    });
});

describe('TIME_PATTERN', () => {
    test('accepts 24-hour ranges with hyphen, en dash, or em dash', () => {
        for (const time of VALID_TIMES) expect(time).toMatch(TIME_PATTERN);
    });

    test('rejects out-of-range hours, minutes, and 12-hour formats', () => {
        for (const time of INVALID_TIMES) expect(time).not.toMatch(TIME_PATTERN);
    });
});

describe('URL_PATTERN', () => {
    test('accepts http and https urls', () => {
        for (const url of VALID_URLS) expect(url).toMatch(URL_PATTERN);
    });

    test('rejects other schemes and bare hosts', () => {
        for (const url of INVALID_URLS) expect(url).not.toMatch(URL_PATTERN);
    });
});

describe('limits', () => {
    test('password minimum is below password maximum', () => {
        expect(PASSWORD_MIN).toBeLessThan(PASSWORD_MAX);
    });

    test('field maxima are positive', () => {
        expect(EMAIL_MAX).toBeGreaterThan(0);
        expect(MESSAGE_MAX).toBeGreaterThan(0);
        expect(NAME_MAX).toBeGreaterThan(0);
        expect(WECHAT_MAX).toBeGreaterThan(0);
    });
});
