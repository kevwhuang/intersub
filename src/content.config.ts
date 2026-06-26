import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const CONTENT_PATH = 'src/content';
const LEVELS = ['Advanced', 'Beginner', 'Intermediate', 'Cohort'] as const;

const outcomes = defineCollection({
    loader: glob({ base: `./${CONTENT_PATH}/outcomes`, pattern: '**/*.json' }),
    schema: z.object({
        points: z.array(z.string()).min(1),
        summary: z.string(),
        title: z.string(),
    }),
});

const seminars = defineCollection({
    loader: glob({ base: `./${CONTENT_PATH}/seminars`, pattern: '**/*.json' }),
    schema: z.object({
        content: z.string(),
        cover: z.string().optional(),
        date: z.string(),
        level: z.enum(LEVELS).optional(),
        location: z.string(),
        title: z.string(),
    }),
});

const testimonials = defineCollection({
    loader: glob({ base: `./${CONTENT_PATH}/testimonials`, pattern: '**/*.json' }),
    schema: z.object({
        industry: z.string(),
        name: z.string(),
        quote: z.string(),
        role: z.string(),
    }),
});

export const collections = { outcomes, seminars, testimonials };
