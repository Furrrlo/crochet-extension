import {
    blockNavigation,
    type ConstructUrlOptions,
    createRouter,
    type Hooks,
    serializeSearch
} from 'sv-router';
import Videos from "./pages/Videos.svelte";
import NotFound from "./pages/NotFound.svelte";

// Force navigation to respect beforeunload event listeners
const beforeUnloadHook = ((): Hooks => {
    let justAllowed = false;
    const blockNavigationCallback = () => {
        const cancelled = !window.dispatchEvent(new Event('beforeunload', {cancelable: true}));
        if (cancelled && !window.confirm("Le modifiche apportate potrebbero non essere salvate.")) {
            return false;
        }

        justAllowed = true;
        return true;
    };

    blockNavigation(blockNavigationCallback)
    return {
        beforeLoad: () => {
            if (justAllowed) {
                blockNavigation(blockNavigationCallback)
                justAllowed = false;
            }
        }
    }
})()

const router = createRouter({
    '/': Videos,
    '/add': Videos,
    '/add/:nv': Videos,
    '/settings': Videos,
    '*': NotFound,
    hooks: beforeUnloadHook,
});

export const {navigate, isActive, route} = router;
// Fix p to work with hash-based routing and search params
export const p: typeof router.p = (path: string, options?: ConstructUrlOptions & {
    params?: Record<string, string | number | boolean>,
}): string => {
    const p = router.p as (p: typeof path, o: typeof options) => string;
    if (options?.search !== undefined) {
        let res = p(path, {...options, search: undefined});
        return serializeSearch(options.search) + res;
    }

    return p(path, options)
};