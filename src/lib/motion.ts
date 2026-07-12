import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SCROLL_DURATION = 0.6;
const SCROLL_EASE = 'power3.out';
const SCROLL_OFFSET = 26;

function initScrollAnimations() {
    const elements = document.querySelectorAll<HTMLElement>('[data-scroll]');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elements.forEach((element) => {
            element.style.opacity = '1';
        });

        return;
    }

    elements.forEach((element) => {
        const stagger = Number.parseFloat(element.dataset.scrollStagger || '0');

        const from: gsap.TweenVars = { opacity: 0, y: SCROLL_OFFSET };

        const to: gsap.TweenVars = {
            duration: SCROLL_DURATION,
            ease: SCROLL_EASE,
            opacity: 1,
            scrollTrigger: {
                start: 'top 85%',
                trigger: element,
            },
            y: 0,
        };

        if (stagger > 0) {
            const children = element.children;

            gsap.set(element, { opacity: 1 });
            gsap.set(children, from);
            to.stagger = stagger;
            gsap.to(children, to);
        } else {
            gsap.fromTo(element, from, to);
        }
    });
}

export function initMotion() {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    initScrollAnimations();
}

gsap.registerPlugin(ScrollTrigger);
