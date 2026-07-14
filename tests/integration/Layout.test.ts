import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test, vi } from 'vitest';

import Layout from '../../src/Layout.astro';
import descriptions from '../../src/content/translations/descriptions.json';
import titles from '../../src/content/translations/titles.json';

const DESCRIPTION = 'InterSub helps corporate teams communicate confidently in English.';
const HOME_DESCRIPTION = 'Business English training for Chinese professionals. Private coaching, team workshops, and focused events. Founded by Lydia Zhu.';
const OUTCOMES_TITLE = 'Outcomes \u2014 InterSub';
const SITE = 'https://intersubstudio.com';
const SLOT = '<main data-slot="page">Slot content</main>';
const TITLE = 'Events \u2014 InterSub';
const UNTRANSLATED_TITLE = 'Mystery Page \u2014 InterSub';
const ZH_ACCEPT_LANGUAGE = 'zh-CN,zh;q=0.9,en;q=0.8';

class SiteAwareUrl extends URL {
    constructor(input: string | URL, base?: string | URL) {
        super(input, base ?? SITE);
    }
}

async function renderWithHeaders(headers: Record<string, string>, title = TITLE) {
    const container = await AstroContainer.create();
    const request = new Request('http://localhost/', { headers });

    vi.stubGlobal('URL', SiteAwareUrl);

    try {
        return await container.renderToString(Layout, {
            partial: false,
            props: { description: HOME_DESCRIPTION, title },
            request,
            slots: { default: SLOT },
        });
    } finally {
        vi.unstubAllGlobals();
    }
}

describe('Layout', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        vi.stubGlobal('URL', SiteAwareUrl);

        try {
            html = await container.renderToString(Layout, {
                partial: false,
                props: { description: DESCRIPTION, title: TITLE },
                slots: { default: SLOT },
            });
        } finally {
            vi.unstubAllGlobals();
        }
    });

    test('renders the full page skeleton', () => {
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('<head>');
        expect(html).toContain('</head>');
        expect(html).toContain('<body class="flex flex-col min-h-screen antialiased font-sans bg-white text-slate">');
        expect(html).toContain('</body></html>');
    });

    test('declares the charset and viewport metas', () => {
        expect(html).toContain('<meta charset="utf-8">');
        expect(html).toContain('<meta content="width=device-width, initial-scale=1" name="viewport">');
    });

    test('composes the document title from the title prop', () => {
        expect(html).toContain(`<title>${TITLE}</title>`);
    });

    test('wires the description prop into meta tags', () => {
        expect(html).toContain(`<meta content="${DESCRIPTION}" name="description">`);
        expect(html).toContain(`<meta content="${DESCRIPTION}" property="og:description">`);
        expect(html).toContain(`<meta content="${DESCRIPTION}" name="twitter:description">`);
    });

    test('mirrors the title into social metas', () => {
        expect(html).toContain(`<meta content="${TITLE}" property="og:title">`);
        expect(html).toContain(`<meta content="${TITLE}" name="twitter:title">`);
    });

    test('renders canonical and site identity tags', () => {
        expect(html).toContain(`<link href="${SITE}/" rel="canonical">`);
        expect(html).toContain('<meta content="InterSub" property="og:site_name">');
        expect(html).toContain('<meta content="website" property="og:type">');
        expect(html).toContain('<meta content="summary_large_image" name="twitter:card">');
        expect(html).toContain('<meta content="Kevin Huang" name="author">');
        expect(html).toContain('<meta content="#ffffff" name="theme-color">');
        expect(html).toContain('property="og:image"');
    });

    test('links the favicon and touch icon', () => {
        expect(html).toContain('<link href="/apple-touch-icon.png" rel="apple-touch-icon">');
        expect(html).toContain('<link href="/favicon.ico" rel="icon" type="image/x-icon">');
    });

    test('embeds valid json-ld describing the site', () => {
        const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

        const jsonLd = match ? JSON.parse(match[1]) : null;

        expect(jsonLd).not.toBeNull();
        expect(jsonLd['@context']).toBe('https://schema.org');
        expect(jsonLd['@type']).toBe('WebSite');
        expect(jsonLd.name).toBe('InterSub');
        expect(jsonLd.author).toEqual({ '@type': 'Person', 'name': 'Kevin Huang' });
    });

    test('enables the client router', () => {
        expect(html).toContain('<meta name="astro-view-transitions-enabled" content="true">');
        expect(html).toContain('<meta name="astro-view-transitions-fallback" content="animate">');
        expect(html.split('ClientRouter.astro?astro&type=script').length - 1).toBe(1);
    });

    test('attaches exactly one page-load script hook', () => {
        expect(html.split('Layout.astro?astro&type=script').length - 1).toBe(1);
    });

    test('renders slot content inside the body', () => {
        expect(html).toContain(SLOT);
        expect(html.indexOf(SLOT)).toBeGreaterThan(html.indexOf('<body'));
        expect(html.indexOf(SLOT)).toBeLessThan(html.indexOf('</body>'));
    });
});

describe('language negotiation', () => {
    test('serves chinese when the lang cookie is zh', async () => {
        const negotiated = await renderWithHeaders({ cookie: 'lang=zh' });

        expect(negotiated).toContain('<html lang="zh">');
        expect(negotiated).toContain('<meta content="言际阁" property="og:site_name">');
        expect(negotiated).toContain(`<meta content="${descriptions[HOME_DESCRIPTION]}" name="description">`);
    });

    test('keeps english when the lang cookie is en despite a chinese accept-language', async () => {
        const negotiated = await renderWithHeaders({ 'accept-language': ZH_ACCEPT_LANGUAGE, 'cookie': 'lang=en' });

        expect(negotiated).toContain('<html lang="en">');
        expect(negotiated).toContain('<meta content="InterSub" property="og:site_name">');
        expect(negotiated).toContain(`<meta content="${HOME_DESCRIPTION}" name="description">`);
    });

    test('serves chinese from accept-language when no cookie is set', async () => {
        const negotiated = await renderWithHeaders({ 'accept-language': ZH_ACCEPT_LANGUAGE });

        expect(negotiated).toContain('<html lang="zh">');
        expect(negotiated).toContain('<meta content="言际阁" property="og:site_name">');
        expect(negotiated).toContain(`<meta content="${descriptions[HOME_DESCRIPTION]}" name="description">`);
    });

    test('defaults to english without language signals', async () => {
        const negotiated = await renderWithHeaders({});

        expect(negotiated).toContain('<html lang="en">');
        expect(negotiated).toContain('<meta content="InterSub" property="og:site_name">');
        expect(negotiated).toContain(`<meta content="${HOME_DESCRIPTION}" name="description">`);
    });
});

describe('title localization', () => {
    test('serves the exact chinese title for a titles.json key', async () => {
        const negotiated = await renderWithHeaders({ cookie: 'lang=zh' });

        expect(negotiated).toContain(`<title>${titles[TITLE]}</title>`);
        expect(negotiated).toContain(`<meta content="${TITLE}" name="title-en">`);
        expect(negotiated).toContain(`<meta content="${titles[TITLE]}" property="og:title">`);
    });

    test('composes the chinese title from the translated prefix when no exact key exists', async () => {
        const negotiated = await renderWithHeaders({ cookie: 'lang=zh' }, OUTCOMES_TITLE);

        expect(negotiated).toContain('<title>成果案例 \u2014 InterSub</title>');
        expect(negotiated).toContain(`<meta content="${OUTCOMES_TITLE}" name="title-en">`);
        expect(negotiated).toContain('<meta content="成果案例 \u2014 InterSub" property="og:title">');
    });

    test('keeps an untranslatable title in english', async () => {
        const negotiated = await renderWithHeaders({ cookie: 'lang=zh' }, UNTRANSLATED_TITLE);

        expect(negotiated).toContain(`<title>${UNTRANSLATED_TITLE}</title>`);
        expect(negotiated).toContain(`<meta content="${UNTRANSLATED_TITLE}" name="title-en">`);
        expect(negotiated).toContain(`<meta content="${UNTRANSLATED_TITLE}" property="og:title">`);
    });
});
