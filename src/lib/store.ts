import { getCollection } from 'astro:content';
import { getStore } from '@netlify/blobs';

import { COLLECTIONS, IS_DEV } from '@lib/constants';

type CollectionName = (typeof COLLECTIONS)[number];

export function compareByDateDescending(entryA: Record<string, unknown>, entryB: Record<string, unknown>): number {
    return String(entryB.date ?? '').localeCompare(String(entryA.date ?? ''));
}

export function compareByNumericId(entryA: Record<string, unknown>, entryB: Record<string, unknown>): number {
    return Number(entryA.id) - Number(entryB.id);
}

export async function getEvents(): Promise<Record<string, unknown>[]> {
    const events = await loadCollection('events');

    return events.sort(compareByDateDescending);
}

export async function getOutcomes(): Promise<Record<string, unknown>[]> {
    const outcomes = await loadCollection('outcomes');

    return outcomes.sort(compareByNumericId);
}

export async function getTestimonials(): Promise<Record<string, unknown>[]> {
    return loadCollection('testimonials');
}

async function loadCollection(name: CollectionName): Promise<Record<string, unknown>[]> {
    if (IS_DEV) return loadSeed(name);

    try {
        const store = getStore({ consistency: 'strong', name });

        const { blobs } = await store.list();

        const entries = await Promise.all(
            blobs.map(async (blob) => {
                const data = await store.get(blob.key, { type: 'json' });

                return data ? [{ id: blob.key, ...data }] : [];
            }),
        );

        return entries.flat();
    } catch {
        return loadSeed(name);
    }
}

async function loadSeed(name: CollectionName): Promise<Record<string, unknown>[]> {
    const entries = await getCollection(name as 'outcomes');

    return entries.map((entry: { data: Record<string, unknown>; id: string }) => ({
        id: entry.id,
        ...entry.data,
    }));
}
