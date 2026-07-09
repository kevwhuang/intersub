import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { CONTENT_DIR, LEVELS } from '@lib/constants';

const events = defineCollection({
    loader: glob({ base: `./${CONTENT_DIR}/events`, pattern: '**/*.json' }),
    schema: z.object({
        content: z.string(),
        cover: z.string().optional(),
        date: z.string(),
        level: z.enum(LEVELS).optional(),
        location: z.string(),
        time: z.string(),
        title: z.string(),
    }),
});

const outcomes = defineCollection({
    loader: glob({ base: `./${CONTENT_DIR}/outcomes`, pattern: '**/*.json' }),
    schema: z.object({
        points: z.array(z.string()).min(1),
        summary: z.string(),
        title: z.string(),
    }),
});

const testimonials = defineCollection({
    loader: glob({ base: `./${CONTENT_DIR}/testimonials`, pattern: '**/*.json' }),
    schema: z.object({
        industry: z.string(),
        name: z.string(),
        quote: z.string(),
        role: z.string(),
    }),
});

export const collections = { events, outcomes, testimonials };
