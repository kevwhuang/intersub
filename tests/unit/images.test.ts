import { describe, expect, test } from 'vitest';

import { getCoverImage, resolveCover } from '../../src/lib/images';

const EXTERNAL_COVER = 'https://example.com/images/covers/summit.jpg';
const INTERNAL_COVER = '/images/events/2026-06-15.webp';
const UNKNOWN_COVER = '/images/events/unknown.webp';

describe('getCoverImage', () => {
    test('returns image metadata for a known internal cover', () => {
        const image = getCoverImage(INTERNAL_COVER);

        expect(image).not.toBeNull();
        expect(image?.src).toContain('2026-06-15');
        expect(image?.format).toBe('webp');
    });

    test('returns null for an unknown path', () => {
        expect(getCoverImage(UNKNOWN_COVER)).toBeNull();
    });
});

describe('resolveCover', () => {
    test('returns the processed src for an internal cover', () => {
        const image = getCoverImage(INTERNAL_COVER);

        expect(resolveCover(INTERNAL_COVER)).toBe(image?.src);
        expect(resolveCover(INTERNAL_COVER)).not.toBe(INTERNAL_COVER);
    });

    test('passes external urls through unchanged', () => {
        expect(resolveCover(EXTERNAL_COVER)).toBe(EXTERNAL_COVER);
    });
});
