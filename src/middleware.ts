import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
    if (context.url.pathname === '/500') return next();

    try {
        const response = await next();

        if (response.status >= 500) return context.rewrite('/500');

        return response;
    } catch {
        return context.rewrite('/500');
    }
});
