import type { ImageMetadata } from 'astro';

const COVER_IMAGES = import.meta.glob<ImageMetadata>('/src/images/events/*', { eager: true, import: 'default' });

export function getCoverImage(cover: string): ImageMetadata | null {
    return COVER_IMAGES[`/src${cover}`] ?? null;
}

export function resolveCover(cover: string): string {
    return getCoverImage(cover)?.src ?? cover;
}
