import { createElement, isValidElement } from 'react';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import ErrorBoundary from '../../src/components/ErrorBoundary';

import type { ReactElement, ReactNode } from 'react';

interface TreeProps {
    children?: ReactNode;
    href?: string;
}

function collectByType(node: ReactNode, type: string): ReactElement<TreeProps>[] {
    if (Array.isArray(node)) return node.flatMap(child => collectByType(child as ReactNode, type));

    if (!isValidElement(node)) return [];

    const element = node as ReactElement<TreeProps>;
    const nested = collectByType(element.props.children, type);

    return element.type === type ? [element, ...nested] : nested;
}

class FailingBoundary extends ErrorBoundary {
    state = { hasError: true };
}

describe('ErrorBoundary', () => {
    test('renders its children while no error is caught', () => {
        const children = createElement('p', null, 'Dashboard ready');
        const boundary = new ErrorBoundary({ children });

        expect(boundary.render()).toBe(children);
    });

    test('derives the error state from a caught error', () => {
        expect(ErrorBoundary.getDerivedStateFromError()).toEqual({ hasError: true });
    });

    test('replaces children with the fallback after an error', () => {
        const html = renderToStaticMarkup(createElement(FailingBoundary, null, createElement('p', null, 'Dashboard ready')));

        expect(html).not.toContain('Dashboard ready');
        expect(html).toContain('>Error</p>');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('Something went wrong</h1>');
        expect(html).toContain('Try refreshing the page or returning home.');
    });

    test('washes the oversized error glyph with the brand color', () => {
        const html = renderToStaticMarkup(createElement(FailingBoundary, null, null));

        expect(html).toContain('color:color-mix(in srgb, var(--color-cobalt) 18%, var(--color-white))');
        expect(html).toContain('font-family:var(--font-heading)');
    });

    test('offers a single home action', () => {
        const html = renderToStaticMarkup(createElement(FailingBoundary, null, null));

        expect(html).not.toContain('<button');
        expect(html).toContain('<a class="button" href="/">Go home</a>');
    });

    test('points the home link at the root', () => {
        const boundary = new ErrorBoundary({ children: null });

        Object.assign(boundary.state, { hasError: true });

        const fallback = boundary.render();
        const [homeLink] = collectByType(fallback, 'a');

        expect(homeLink.props.href).toBe('/');
    });
});
