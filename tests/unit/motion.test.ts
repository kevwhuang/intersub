import { afterEach, describe, expect, test, vi } from 'vitest';

import type { Mock } from 'vitest';

interface ElementStub {
    children: ElementStub[];
    dataset: { scrollStagger?: string };
    style: { opacity: string };
}

interface Killable {
    kill: Mock;
}

interface MotionOptions {
    elements?: ElementStub[];
    fontsReady?: Promise<void>;
    hash?: string;
    prefersReducedMotion?: boolean;
}

const SCROLL_DURATION = 0.6;
const SCROLL_EASE = 'power3.out';
const SCROLL_OFFSET = 26;
const SCROLL_SELECTOR = '[data-scroll]';
const SCROLL_START = 'top 85%';
const VISIBLE_OPACITY = '1';

const { gsapStub, scrollTriggerStub, state } = vi.hoisted(() => {
    const gsapStub = {
        fromTo: vi.fn<(target: unknown, from: unknown, to: Record<string, unknown>) => void>(),
        registerPlugin: vi.fn(),
        set: vi.fn<(targets: unknown, vars: Record<string, unknown>) => void>(),
        to: vi.fn<(targets: unknown, vars: Record<string, unknown>) => void>(),
    };

    const scrollTriggerStub = {
        getAll: vi.fn(() => state.scrollTriggers),
        refresh: vi.fn(),
    };

    const state = {
        scrollTriggers: [] as Killable[],
    };

    return { gsapStub, scrollTriggerStub, state };
});

function buildElement(scrollStagger?: string, children: ElementStub[] = []): ElementStub {
    return { children, dataset: { scrollStagger }, style: { opacity: '' } };
}

function buildKillable(): Killable {
    return { kill: vi.fn() };
}

async function loadMotion({ elements = [], fontsReady = Promise.resolve(), hash = '', prefersReducedMotion = false }: MotionOptions = {}) {
    state.scrollTriggers = [];
    vi.clearAllMocks();
    vi.resetModules();

    const hashTarget = { scrollIntoView: vi.fn() };

    const documentStub = {
        fonts: { ready: fontsReady },
        getElementById: vi.fn((id: string) => `#${id}` === hash ? hashTarget : null),
        querySelectorAll: vi.fn((selector: string) => selector === SCROLL_SELECTOR ? elements : []),
    };

    const windowStub = {
        location: { hash },
        matchMedia: vi.fn(() => ({ matches: prefersReducedMotion })),
    };

    vi.stubGlobal('document', documentStub);
    vi.stubGlobal('window', windowStub);

    const { initMotion } = await import('../../src/lib/motion');

    return { documentStub, hashTarget, initMotion };
}

vi.mock('gsap', () => ({ default: gsapStub }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: scrollTriggerStub }));

afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
});

describe('initMotion', () => {
    test('reveals every data-scroll element inline under reduced motion without registering a tween', async () => {
        const elements = [buildElement(), buildElement('0.12', [buildElement()])];

        const { initMotion } = await loadMotion({ elements, prefersReducedMotion: true });

        await initMotion();

        for (const [index, element] of elements.entries()) {
            expect(element.style.opacity, `element ${index}`).toBe(VISIBLE_OPACITY);
        }

        expect(gsapStub.fromTo).not.toHaveBeenCalled();
        expect(gsapStub.set).not.toHaveBeenCalled();
        expect(gsapStub.to).not.toHaveBeenCalled();
    });

    test('reveals a staggered container and tweens its hidden children with the data-scroll-stagger value', async () => {
        const children = [buildElement(), buildElement()];

        const element = buildElement('0.12', children);

        const { initMotion } = await loadMotion({ elements: [element] });

        await initMotion();

        expect(gsapStub.set).toHaveBeenNthCalledWith(1, element, { opacity: 1 });
        expect(gsapStub.set).toHaveBeenNthCalledWith(2, children, { opacity: 0, y: SCROLL_OFFSET });

        expect(gsapStub.to).toHaveBeenCalledExactlyOnceWith(children, {
            duration: SCROLL_DURATION,
            ease: SCROLL_EASE,
            opacity: 1,
            scrollTrigger: { start: SCROLL_START, trigger: element },
            stagger: 0.12,
            y: 0,
        });

        expect(gsapStub.fromTo).not.toHaveBeenCalled();
    });

    test('fades and lifts a plain data-scroll element on a scroll trigger starting at top 85%', async () => {
        const element = buildElement();

        const { initMotion } = await loadMotion({ elements: [element] });

        await initMotion();

        expect(gsapStub.fromTo).toHaveBeenCalledExactlyOnceWith(
            element,
            { opacity: 0, y: SCROLL_OFFSET },
            {
                duration: SCROLL_DURATION,
                ease: SCROLL_EASE,
                opacity: 1,
                scrollTrigger: { start: SCROLL_START, trigger: element },
                y: 0,
            },
        );

        expect(gsapStub.to).not.toHaveBeenCalled();
    });

    test('kills every scroll trigger returned by getAll on a second run', async () => {
        const { initMotion } = await loadMotion();

        const triggers = [buildKillable(), buildKillable()];

        await initMotion();

        state.scrollTriggers = triggers;

        await initMotion();

        for (const [index, trigger] of triggers.entries()) {
            expect(trigger.kill, `trigger ${index}`).toHaveBeenCalledTimes(1);
        }
    });

    test('refreshes scroll triggers after the document fonts promise resolves', async () => {
        let resolveFonts = () => {};

        const fontsReady = new Promise<void>((resolve) => {
            resolveFonts = resolve;
        });

        const { initMotion } = await loadMotion({ fontsReady });

        const pending = initMotion();

        expect(scrollTriggerStub.refresh).not.toHaveBeenCalled();

        resolveFonts();

        await pending;

        expect(scrollTriggerStub.refresh).toHaveBeenCalledTimes(1);
    });

    test('scrolls the element matching the location hash into view', async () => {
        const { documentStub, hashTarget, initMotion } = await loadMotion({ hash: '#programs' });

        await initMotion();

        expect(documentStub.getElementById).toHaveBeenCalledExactlyOnceWith('programs');
        expect(hashTarget.scrollIntoView).toHaveBeenCalledTimes(1);
    });

    test('scrolls nothing when the location hash is empty', async () => {
        const { documentStub, hashTarget, initMotion } = await loadMotion();

        await initMotion();

        expect(documentStub.getElementById).not.toHaveBeenCalled();
        expect(hashTarget.scrollIntoView).not.toHaveBeenCalled();
    });
});

describe('module scope', () => {
    test('registers the scroll trigger plugin with gsap', async () => {
        await loadMotion();

        expect(gsapStub.registerPlugin).toHaveBeenCalledExactlyOnceWith(scrollTriggerStub);
    });
});
