import { getCollection } from 'astro:content';
import { getStore } from '@netlify/blobs';

import { COLLECTIONS, IS_DEV } from '@lib/constants';

type CollectionName = (typeof COLLECTIONS)[number];

interface CollectionEntries {
    events: AdminEvent;
    outcomes: AdminOutcome;
    testimonials: AdminTestimonial;
}

async function loadCollection<Name extends CollectionName>(name: Name): Promise<CollectionEntries[Name][]> {
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

async function loadSeed<Name extends CollectionName>(name: Name): Promise<CollectionEntries[Name][]> {
    const entries = await getCollection(name as 'outcomes');

    return entries.map(entry => ({
        id: entry.id,
        ...entry.data,
    })) as CollectionEntries[Name][];
}

export function compareByDateDescending(entryA: { date?: unknown }, entryB: { date?: unknown }): number {
    return String(entryB.date ?? '').localeCompare(String(entryA.date ?? ''));
}

export function compareByNumericId(entryA: { id?: unknown }, entryB: { id?: unknown }): number {
    return Number(entryA.id) - Number(entryB.id);
}

export async function getEvents(): Promise<AdminEvent[]> {
    const events = await loadCollection('events');

    return events.sort(compareByDateDescending);
}

export async function getOutcomes(): Promise<AdminOutcome[]> {
    const outcomes = await loadCollection('outcomes');

    return outcomes.sort(compareByNumericId);
}

export async function getTestimonials(): Promise<AdminTestimonial[]> {
    return loadCollection('testimonials');
}
