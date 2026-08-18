import { describe, expect, test } from 'vitest';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

import { getCoverImage, resolveCover } from '../../src/lib/images';

const EXTERNAL_COVER = 'https://example.com/images/covers/summit.jpg';
const UNKNOWN_COVER = '/images/events/unknown.webp';

const [coverFile] = readdirSync(join(process.cwd(), 'src/images/events'))
    .filter(file => file.endsWith('.webp'))
    .sort();

const coverStem = coverFile.replace('.webp', '');
const internalCover = `/images/events/${coverFile}`;

describe('getCoverImage', () => {
    test('returns image metadata for a known internal cover', () => {
        const image = getCoverImage(internalCover);

        expect(image).not.toBeNull();
        expect(image?.src).toContain(coverStem);
        expect(image?.format).toBe('webp');
    });

    test('returns null for an unknown path', () => {
        expect(getCoverImage(UNKNOWN_COVER)).toBeNull();
    });
});

describe('resolveCover', () => {
    test('returns the processed src for an internal cover', () => {
        const image = getCoverImage(internalCover);

        expect(resolveCover(internalCover)).toBe(image?.src);
        expect(resolveCover(internalCover)).not.toBe(internalCover);
    });

    test('passes external urls through unchanged', () => {
        expect(resolveCover(EXTERNAL_COVER)).toBe(EXTERNAL_COVER);
    });
});
