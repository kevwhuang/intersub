import { getCollection } from 'astro:content';
import { getStore } from '@netlify/blobs';

function merge(seed: Record<string, unknown>[], overrides: Record<string, unknown>[]): Record<string, unknown>[] {
    const map = new Map<string, Record<string, unknown>>();

    for (const entry of seed) {
        map.set(String(entry.id), entry);
    }

    for (const entry of overrides) {
        map.set(String(entry.id), entry);
    }

    return [...map.values()];
}

export async function getOutcomes(): Promise<Record<string, unknown>[]> {
    const entries = await getCollection('outcomes');

    const seed = entries.map(entry => ({
        id: entry.id,
        ...entry.data,
    }));

    try {
        const store = getStore('outcomes');
        const { blobs } = await store.list();

        if (blobs.length > 0) {
            const overrides = await Promise.all(
                blobs.map(async (blob) => {
                    const data = await store.get(blob.key, { type: 'json' });
                    return { id: blob.key, ...data };
                }),
            );

            return merge(seed, overrides);
        }
    } catch {
        return seed;
    }

    return seed;
}

export async function getTestimonials(): Promise<Record<string, unknown>[]> {
    const entries = await getCollection('testimonials');

    const seed = entries.map(entry => ({
        id: entry.id,
        ...entry.data,
    }));

    try {
        const store = getStore('testimonials');
        const { blobs } = await store.list();

        if (blobs.length > 0) {
            const overrides = await Promise.all(
                blobs.map(async (blob) => {
                    const data = await store.get(blob.key, { type: 'json' });
                    return { id: blob.key, ...data };
                }),
            );

            return merge(seed, overrides);
        }
    } catch {
        return seed;
    }

    return seed;
}

export async function getSeminars(): Promise<Record<string, unknown>[]> {
    const entries = await getCollection('seminars');

    const seed = entries
        .sort((a, b) => b.data.date.localeCompare(a.data.date))
        .map(entry => ({
            id: entry.id,
            ...entry.data,
        }));

    try {
        const store = getStore('seminars');
        const { blobs } = await store.list();

        if (blobs.length > 0) {
            const overrides = await Promise.all(
                blobs.map(async (blob) => {
                    const data = await store.get(blob.key, { type: 'json' });
                    return { id: blob.key, ...data };
                }),
            );

            const merged = merge(seed, overrides);

            return merged.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
        }
    } catch {
        return seed;
    }

    return seed;
}
