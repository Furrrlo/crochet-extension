// noinspection JSUnusedGlobalSymbols

/**
 * Experimental properties of the IntersectionObserver
 */
declare global {
    interface IntersectionObserverEntry {
        /**
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry#browser_compatibility)
         */
        isVisible: boolean | undefined;
    }

    interface IntersectionObserverInit {
        /**
         * When tracking target visibility (trackVisibility is true), this can be used to set the minimum delay in
         * milliseconds between notifications from this observer. Limiting the notification rate is desirable because
         * the visibility calculation is computationally intensive. If tracking visibility, the value will be set to
         * 100 for any value less than 100, and you should use the largest tolerable value. The value is 0 by default.
         *
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#delay)
         */
        delay: number;

        /**
         * A boolean indicating whether this IntersectionObserver is tracking changes in a target's visibility.
         *
         * When false the browser will report intersections when the target element scrolls into the root element's
         * viewport. When true, the browser will additionally check that the target is actually visible, and hasn't
         * been covered by other elements or potentially been distorted or hidden by a filter, reduced opacity, or
         * some transform. The value is false by default as tracking visibility is computationally intensive. If this
         * is set, a delay should also be set.
         *
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#trackvisibility)
         */
        trackVisibility: boolean;
    }
}