import { getCollection } from 'astro:content';
import { getStore } from '@netlify/blobs';

const DEV = import.meta.env.DEV;

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

async function loadCollection(name: 'outcomes' | 'events' | 'testimonials'): Promise<Record<string, unknown>[]> {
    const entries = await getCollection(name as 'outcomes');

    const seed = entries.map((entry: { data: Record<string, unknown>; id: string }) => ({
        id: entry.id,
        ...entry.data,
    }));

    if (DEV) return seed;

    try {
        const store = getStore({ consistency: 'strong', name });
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

export async function getOutcomes(): Promise<Record<string, unknown>[]> {
    return loadCollection('outcomes');
}

export async function getEvents(): Promise<Record<string, unknown>[]> {
    const events = await loadCollection('events');

    return events.sort((entryA, entryB) => String(entryB.date ?? '').localeCompare(String(entryA.date ?? '')));
}

export async function getTestimonials(): Promise<Record<string, unknown>[]> {
    return loadCollection('testimonials');
}
