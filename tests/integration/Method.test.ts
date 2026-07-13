import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Method from '../../src/sections/Method.astro';

const METHOD_BLOCKS = [
    {
        detail: '1:1 coaching, team workshops, and focused events. Every engagement starts from your real work.',
        label: 'What we do',
        statement: 'Customized training based on real scenarios and skill gaps',
        step: '1',
    },
    {
        detail: 'Practice on your real scenarios: actual emails, meeting agendas, deal calls. Activation-based drills, not textbook repetition. No theory. Just results.',
        label: 'How we work',
        statement: 'Six-step closed-loop from diagnosis to results',
        step: '2',
    },
    {
        detail: 'Those who command authority in Mandarin but lose it in English. Also, social strivers and overseas travelers.',
        label: 'Who we serve',
        statement: 'For adult plateau learners, focusing on instant response and fluency',
        step: '3',
    },
    {
        detail: 'Emails that persuade. Calls that close. What you practice today, you use tomorrow.',
        label: 'What changes',
        statement: 'Thinking in English, speaking on instinct',
        step: '4',
    },
] as const;

function expectAscending(positions: number[]) {
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((positionA, positionB) => positionA - positionB));
}

describe('Method', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Method);
    });

    test('labels the section for assistive tech with an i18n hook', () => {
        expect(html).toContain('aria-label="Our method"');
        expect(html).toContain('data-i18n-aria="Our method"');
    });

    test('renders the decorative method curve svg', () => {
        expect(html).toMatch(/<svg[^>]*class="method__curve"[^>]*aria-hidden="true"/);
        expect(html).toContain('viewBox="0 0 300 1000"');
        expect(html.split('method__curve-path').length - 1).toBe(1);
        expect(html.split('method__curve-dot').length - 1).toBe(4);
    });

    test('renders one block per method step', () => {
        expect(html.split('<div class="method__block').length - 1).toBe(METHOD_BLOCKS.length);
    });

    test('renders step numbers in order', () => {
        expect(html.split('method__number').length - 1).toBe(METHOD_BLOCKS.length);
        expectAscending(METHOD_BLOCKS.map(block => html.indexOf(`>${block.step}</span>`)));
    });

    test('renders block labels in order with i18n hooks', () => {
        expectAscending(METHOD_BLOCKS.map(block => html.indexOf(`data-i18n="${block.label}"`)));
    });

    test('renders block statements as headings in order with i18n hooks', () => {
        for (const block of METHOD_BLOCKS) expect(html).toMatch(new RegExp(`<h2[^>]*data-i18n="${block.statement}"`));

        expectAscending(METHOD_BLOCKS.map(block => html.indexOf(`data-i18n="${block.statement}"`)));
    });

    test('renders block details with i18n hooks', () => {
        for (const block of METHOD_BLOCKS) expect(html).toContain(`data-i18n="${block.detail}"`);
    });

    test('indents every other block', () => {
        expect(html.split('method__block--indent').length - 1).toBe(2);
    });

    test('marks every block for scroll animation', () => {
        expect(html.split('data-scroll').length - 1).toBe(METHOD_BLOCKS.length);
    });
});
